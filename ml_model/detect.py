# detect.py
from ultralytics import YOLO
import sys
import cv2
import os

# Load YOLO model once
model = YOLO(os.path.join("runs", "detect", "train2", "weights", "best.pt"))

def main(image_path):
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        print("none")
        sys.exit(0)

    # Run YOLO detection
    results = model(img, verbose=False)
    names = results[0].names
    detected = []

    for box in results[0].boxes:
        detected.append(names[int(box.cls)])

    # Print result (Node.js will read stdout)
    if detected:
        print(",".join(set(detected)))
    else:
        print("none")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python detect.py <image_path>")
        sys.exit(1)
    main(sys.argv[1])
