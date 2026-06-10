import sys
import json
import argparse
import os
from itertools import combinations

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

def extract_plate_number(img_rgb, x1, y1, x2, y2, reader):
    h = y2 - y1
    w = x2 - x1

    crops = [
        img_rgb[y1:y2,              x1:x2],
        img_rgb[y1+int(h*0.3):y2,  x1:x2],
        img_rgb[y1+int(h*0.5):y2,  x1+int(w*0.05):x2-int(w*0.05)],
    ]

    best_text = 'NOT FOUND'
    best_conf = 0.0

    for crop in crops:
        if crop.size == 0 or crop.shape[0] < 5 or crop.shape[1] < 5:
            continue
        if crop.shape[0] < 40:
            crop = cv2.resize(crop,
                   (crop.shape[1]*3, crop.shape[0]*3),
                   interpolation=cv2.INTER_CUBIC)
        try:
            gray      = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
            _, thresh = cv2.threshold(gray, 0, 255,
                        cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            enhanced  = cv2.cvtColor(thresh, cv2.COLOR_GRAY2RGB)
        except:
            continue

        for img_try in [crop, enhanced]:
            try:
                ocr_out = reader.readtext(img_try)
                for (_, text, conf) in ocr_out:
                    text = text.upper().replace(' ', '').strip()
                    if conf > best_conf and len(text) >= 4:
                        best_conf = conf
                        best_text = text
            except:
                continue

    return best_text

def classify_hsrp(img_rgb, x1, y1, x2, y2, hsrp_model, hsrp_transform, device, hsrp_classes):
    try:
        crop    = img_rgb[y1:y2, x1:x2]
        if crop.size == 0:
            return 'UNKNOWN'
        pil_img = Image.fromarray(crop)
        tensor  = hsrp_transform(pil_img).unsqueeze(0).to(device)
        with torch.no_grad():
            output = hsrp_model(tensor)
            pred   = torch.argmax(output, dim=1).item()
        return hsrp_classes[pred]
    except:
        return 'UNKNOWN'

def check_triple_riding(detections, iou_threshold=0.1):
    riders = [d for d in detections if d['class'] == 'rider']
    heads = [d for d in detections if d['class'] in ['helmet', 'no_helmet']]
    
    people_to_check = riders if len(riders) >= len(heads) else heads

    if len(people_to_check) < 3:
        return False

    def box_area(b):
        return max(0, b[2]-b[0]) * max(0, b[3]-b[1])

    def intersection(b1, b2):
        x1 = max(b1[0], b2[0])
        y1 = max(b1[1], b2[1])
        x2 = min(b1[2], b2[2])
        y2 = min(b1[3], b2[3])
        return max(0, x2-x1) * max(0, y2-y1)

    for trio in combinations(people_to_check, 3):
        b0 = trio[0]['bbox']
        b1 = trio[1]['bbox']
        b2 = trio[2]['bbox']

        combo_x1 = min(b0[0], b1[0], b2[0])
        combo_y1 = min(b0[1], b1[1], b2[1])
        combo_x2 = max(b0[2], b1[2], b2[2])
        combo_y2 = max(b0[3], b1[3], b2[3])

        combo_w = combo_x2 - combo_x1
        combo_h = combo_y2 - combo_y1

        w0 = b0[2] - b0[0]
        w1 = b1[2] - b1[0]
        w2 = b2[2] - b2[0]
        avg_w = (w0 + w1 + w2) / 3

        is_head_cluster = trio[0]['class'] in ['helmet', 'no_helmet']
        max_width_factor = 4.5 if is_head_cluster else 2.5
        max_height_factor = 3.0 if is_head_cluster else 4.0

        if combo_w < avg_w * max_width_factor and combo_h < avg_w * max_height_factor:
            return True

    return False

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

    # Rule 2: Triple riding
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
    parser.add_argument('--hsrp-model', required=True, help='Path to HSRP classifier model hsrp_classifier.pth')
    args = parser.parse_args()

    try:
        # Load your trained YOLO model
        model = YOLO(args.model)
        
        # Initialize EasyOCR
        reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
        
        # Load HSRP MobileNetV2 model
        hsrp_model = build_hsrp_classifier()
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        hsrp_model.load_state_dict(torch.load(args.hsrp_model, map_location=device))
        hsrp_model.to(device)
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
        best_plate = None
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

            # Keep highest confidence plate
            if cls_name == 'number_plate':
                if best_plate is None or conf > best_plate['conf']:
                    best_plate = {'conf': conf, 'bbox': (x1, y1, x2, y2)}

        # STEP 2: OCR on plate
        plate_number = "NOT FOUND"
        if best_plate is not None:
            x1, y1, x2, y2 = best_plate['bbox']
            plate_number = extract_plate_number(img_rgb, x1, y1, x2, y2, reader)

        # STEP 3: HSRP Classification
        hsrp_status = "UNKNOWN"
        if best_plate is not None:
            x1, y1, x2, y2 = best_plate['bbox']
            hsrp_status = classify_hsrp(img_rgb, x1, y1, x2, y2, hsrp_model, hsrp_transform, device, hsrp_classes)

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

        # Save annotated image (overwriting the uploaded image file)
        try:
            annotated_img = results[0].plot()
            cv2.imwrite(args.image, annotated_img)
        except Exception as plot_err:
            sys.stderr.write(f"PlotSaveError: {str(plot_err)}\n")

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
            "triple_riding": "VIOLATION" if "TRIPLE RIDING" in final_violations else "OK",
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
