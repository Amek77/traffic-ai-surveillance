import sys
import json
import argparse
import os

def print_default_and_exit():
    default_output = {
        "plate_number": "NOT FOUND",
        "hsrp_status": "UNKNOWN",
        "helmet_status": "OK",
        "triple_riding": "OK",
        "violations": [],
        "severity": "NONE",
        "confidence": 0.0,
        "detections": []
    }
    print("__JSON_START__")
    print(json.dumps(default_output))
    print("__JSON_END__")
    sys.exit(1)

try:
    import cv2
    import numpy as np
    import torch
    import torch.nn as nn
    from torchvision import models, transforms
    from PIL import Image
    from ultralytics import YOLO
    import easyocr
except Exception as e:
    # Print default empty JSON on import errors and exit 1
    sys.stderr.write(f"ImportError: {str(e)}\n")
    print_default_and_exit()

# Transform for classifier input
hsrp_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                        [0.229, 0.224, 0.225])
])

hsrp_classes = ['hsrp', 'non-hsrp']

# Build MobileNetV2 classifier structure
def build_hsrp_classifier():
    model = models.mobilenet_v2(weights=None)
    model.classifier[1] = nn.Linear(1280, 2)  # 2 classes: hsrp, non-hsrp
    return model

def run_rule_engine(detections):
    """
    Input:  list of detections from YOLO
    Output: violations dict with severity
    """
    violations    = []
    severity      = "NONE"

    helmet_count    = 0
    no_helmet_count = 0
    rider_count     = 0
    plate_found     = False

    for det in detections:
        cls = det['class']
        if cls == 'helmet'      : helmet_count    += 1
        if cls == 'no_helmet'   : no_helmet_count += 1
        if cls == 'rider'       : rider_count     += 1
        if cls == 'number_plate': plate_found      = True

    # Rule 1: No helmet
    if no_helmet_count > 0:
        violations.append("NO HELMET")

    # Rule 2: Triple riding — proximity based (fixes false positives)
    def check_triple_riding(detections, proximity=150):
        riders = [d['bbox'] for d in detections if d['class'] == 'rider']

        if len(riders) < 3:
            return False

        for i in range(len(riders)):
            nearby = 0
            rx = (riders[i][0] + riders[i][2]) / 2
            ry = (riders[i][1] + riders[i][3]) / 2

            for j in range(len(riders)):
                if i == j: continue
                ox = (riders[j][0] + riders[j][2]) / 2
                oy = (riders[j][1] + riders[j][3]) / 2
                dist = ((rx-ox)**2 + (ry-oy)**2) ** 0.5
                if dist < proximity:
                    nearby += 1

            if nearby >= 2:
                return True
        return False

    if check_triple_riding(detections):
        violations.append("TRIPLE RIDING")

    # Rule 3: Severity
    if len(violations) == 0:
        severity = "NONE"
    elif "TRIPLE RIDING" in violations and "NO HELMET" in violations:
        severity = "HIGH"
    elif "TRIPLE RIDING" in violations:
        severity = "MEDIUM"
    elif "NO HELMET" in violations:
        severity = "LOW"

    return {
        "violations"     : violations,
        "severity"       : severity,
        "helmet_count"   : helmet_count,
        "no_helmet_count": no_helmet_count,
        "rider_count"    : rider_count,
        "plate_found"    : plate_found
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True, help='Path to input traffic image')
    parser.add_argument('--model', required=True, help='Path to YOLOv8 model best.pt')
    args = parser.parse_args()

    try:
        # Load your trained YOLO model
        model = YOLO(args.model)
        
        # Initialize EasyOCR
        reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
        
        # Load HSRP MobileNetV2 model
        hsrp_model = build_hsrp_classifier()
        hsrp_model.eval()

        # Read image
        img_bgr = cv2.imread(args.image)
        if img_bgr is None:
            raise ValueError(f"Could not read image from {args.image}")
            
        h_img, w_img, _ = img_bgr.shape
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # STEP 1: YOLO Detection
        results = model(args.image, conf=0.25, verbose=False)
        boxes = results[0].boxes
        detections = []
        plate_crop = None
        confidence_sum = 0

        for box in boxes:
            cls_id = int(box.cls)
            conf = float(box.conf)
            cls_name = model.names[cls_id]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            
            confidence_sum += conf

            detections.append({
                'class': cls_name,
                'conf' : conf,
                'bbox' : (x1, y1, x2, y2)
            })

            # Crop plate for OCR + HSRP — tighter crop
            if cls_name == 'number_plate':
                height = y2 - y1
                width = x2 - x1
                y1_tight = y1 + int(height * 0.6)
                x1_tight = x1 + int(width * 0.1)
                x2_tight = x2 - int(width * 0.1)
                plate_crop = img_rgb[y1_tight:y2, x1_tight:x2_tight]

        # STEP 2: OCR on plate
        plate_number = "NOT FOUND"
        if plate_crop is not None and plate_crop.size > 0:
            ocr_results = reader.readtext(plate_crop)
            if ocr_results:
                plate_number = max(ocr_results, key=lambda x: x[2])[1]
                plate_number = plate_number.upper().replace(" ", "")

        # STEP 3: HSRP Classification
        hsrp_status = "UNKNOWN"
        if plate_crop is not None and plate_crop.size > 0:
            try:
                pil_img = Image.fromarray(plate_crop)
                tensor = hsrp_transform(pil_img).unsqueeze(0)
                with torch.no_grad():
                    output = hsrp_model(tensor)
                    pred = torch.argmax(output, dim=1).item()
                hsrp_status = hsrp_classes[pred]
            except:
                hsrp_status = "UNKNOWN"

        # STEP 4: Rule Engine
        rule_result = run_rule_engine(detections)

        # STEP 5: Final Output
        final_violations = rule_result['violations']
        
        # If plate is non-HSRP, add to violations list and adjust severity
        if hsrp_status == 'non-hsrp':
            final_violations.append('NON HSRP')
            if rule_result['severity'] == 'NONE':
                rule_result['severity'] = 'LOW'
            elif rule_result['severity'] == 'LOW':
                rule_result['severity'] = 'MEDIUM'
            elif rule_result['severity'] == 'MEDIUM':
                rule_result['severity'] = 'HIGH'

        # Average confidence
        avg_conf = (confidence_sum / len(detections)) if len(detections) > 0 else 0.0

        # Normalize bounding boxes for frontend rendering overlays
        normalized_detections = []
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            left_pct = (x1 / w_img) * 100
            top_pct = (y1 / h_img) * 100
            width_pct = ((x2 - x1) / w_img) * 100
            height_pct = ((y2 - y1) / h_img) * 100
            
            cls_name = det['class'].lower()
            color = '#EF4444' # Default Red
            if cls_name == 'helmet':
                color = '#22C55E' # Green
            elif cls_name == 'rider':
                color = '#F59E0B' # Orange
            elif cls_name == 'number_plate':
                color = '#6C3EE8' # Purple

            normalized_detections.append({
                'class': det['class'],
                'label': det['class'].upper().replace('_', ' '),
                'conf': det['conf'],
                'bbox': [top_pct, left_pct, width_pct, height_pct],
                'color': color
            })

        final_output = {
            "plate_number": plate_number,
            "hsrp_status": hsrp_status,
            "helmet_status": "VIOLATION" if rule_result['no_helmet_count'] > 0 else "OK",
            "triple_riding": "VIOLATION" if rule_result['rider_count'] >= 3 else "OK",
            "violations": final_violations,
            "severity": rule_result['severity'],
            "confidence": avg_conf,
            "detections": normalized_detections
        }

        print("__JSON_START__")
        print(json.dumps(final_output))
        print("__JSON_END__")
        sys.exit(0)

    except Exception as e:
        sys.stderr.write(f"PipelineExecutionError: {str(e)}\n")
        print_default_and_exit()

if __name__ == '__main__':
    main()
