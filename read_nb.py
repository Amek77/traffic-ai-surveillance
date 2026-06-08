import json

with open("traffic-survelliance.ipynb", "r", encoding="utf-8") as f:
    nb = json.load(f)

with open("extracted_cells.txt", "w", encoding="utf-8") as out:
    for idx, cell in enumerate(nb.get("cells", [])):
        if cell.get("cell_type") == "code":
            source = cell.get("source", "")
            if isinstance(source, list):
                source = "".join(source)
            if "def run_full_pipeline" in source or "def run_rule_engine" in source or "cv2.imread" in source:
                out.write(f"--- CELL {idx} ---\n")
                out.write(source)
                out.write("\n" + "="*50 + "\n")
