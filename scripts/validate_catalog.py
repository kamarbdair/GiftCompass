#!/usr/bin/env python3
"""Validate data/products_demo.csv against docs/schemas/product.schema.json,
and the example persona against docs/schemas/persona.schema.json.

Run: python3 scripts/validate_catalog.py
"""
import csv, json, pathlib, sys
from jsonschema import Draft202012Validator

ROOT = pathlib.Path(__file__).resolve().parents[1]
ARRAYS = ["tags", "interest_keys", "style_tags", "occasions", "relationship_fit"]
NUMBERS = ["price_sar", "giftability", "embarrassment_risk", "novelty"]
INTS = ["age_min", "age_max", "delivery_days"]
BOOLS = ["is_experience", "personalizable", "requires_size", "available_in_jeddah"]
NULLABLE = ["product_url", "image_url", "verified_at", "notes"]


def row_to_obj(row):
    o = {}
    for k, v in row.items():
        if k in ARRAYS:
            o[k] = [x for x in v.split("|") if x]
        elif k in NUMBERS:
            o[k] = float(v)
        elif k in INTS:
            o[k] = int(v)
        elif k in BOOLS:
            o[k] = v == "true"
        elif k in NULLABLE:
            o[k] = v or None
        else:
            o[k] = v
    return o


def main():
    errors = 0
    product_schema = json.loads((ROOT / "docs/schemas/product.schema.json").read_text())
    taxonomy = json.loads((ROOT / "docs/schemas/interest-taxonomy.json").read_text())
    valid_keys = {i["key"] for i in taxonomy["interests"]}
    v = Draft202012Validator(product_schema)

    rows = list(csv.DictReader((ROOT / "data/products_demo.csv").open(encoding="utf-8")))
    seen = set()
    for row in rows:
        obj = row_to_obj(row)
        for e in v.iter_errors(obj):
            print(f"  [{row['product_id']}] {'.'.join(str(p) for p in e.path)}: {e.message}")
            errors += 1
        if obj["product_id"] in seen:
            print(f"  duplicate product_id {obj['product_id']}"); errors += 1
        seen.add(obj["product_id"])
        unknown = set(obj["interest_keys"]) - valid_keys
        if unknown:
            print(f"  [{row['product_id']}] interest keys outside taxonomy: {sorted(unknown)}"); errors += 1
        if obj["age_min"] > obj["age_max"]:
            print(f"  [{row['product_id']}] age_min > age_max"); errors += 1
        if obj["data_status"] == "verified" and not obj["product_url"]:
            print(f"  [{row['product_id']}] verified row without product_url"); errors += 1
    print(f"catalog: {len(rows)} rows checked")

    persona_schema = json.loads((ROOT / "docs/schemas/persona.schema.json").read_text())
    pv = Draft202012Validator(persona_schema)
    persona = json.loads((ROOT / "docs/schemas/examples/persona.example.json").read_text())
    for e in pv.iter_errors(persona):
        print(f"  [persona.example] {'.'.join(str(p) for p in e.path)}: {e.message}")
        errors += 1
    for i in persona["interests"]:
        if i["key"] not in valid_keys:
            print(f"  [persona.example] interest '{i['key']}' outside taxonomy"); errors += 1
    print("persona example checked")

    pe = json.loads((ROOT / "docs/schemas/examples/product.example.json").read_text())
    for e in v.iter_errors(pe):
        print(f"  [product.example] {'.'.join(str(p) for p in e.path)}: {e.message}")
        errors += 1
    print("product example checked")

    if errors:
        print(f"\nFAILED with {errors} error(s)")
        return 1
    print("\nAll schema checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
