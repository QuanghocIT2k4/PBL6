import json
from pathlib import Path


def main():
    project_root = Path(__file__).resolve().parent.parent
    src = project_root / "Swagger1112.json"
    formatted = project_root / "Swagger1112_formatted.json"
    diff_report = project_root / "Swagger1112_vs_old_diff.txt"
    old = project_root / "Swagger2711_formatted.json"

    if not src.exists():
        raise FileNotFoundError(f"Source swagger not found: {src}")

    # Pretty print new swagger
    with src.open("r", encoding="utf-8") as f:
        data = json.load(f)
    with formatted.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    report_lines = []
    if old.exists():
        with old.open("r", encoding="utf-8") as f:
            old_data = json.load(f)

        def path_set(swagger: dict) -> set[str]:
            return set(swagger.get("paths", {}).keys())

        new_paths = path_set(data)
        old_paths = path_set(old_data)
        added = sorted(new_paths - old_paths)
        removed = sorted(old_paths - new_paths)

        report_lines.append("### Added paths")
        report_lines.extend(added or ["(none)"])
        report_lines.append("")
        report_lines.append("### Removed paths")
        report_lines.extend(removed or ["(none)"])
        report_lines.append("")

        # Added tags
        def tag_set(swagger: dict) -> set[str]:
            return {t.get("name", "") for t in swagger.get("tags", [])}

        added_tags = sorted(tag_set(data) - tag_set(old_data))
        removed_tags = sorted(tag_set(old_data) - tag_set(data))
        report_lines.append("### Added tags")
        report_lines.extend(added_tags or ["(none)"])
        report_lines.append("")
        report_lines.append("### Removed tags")
        report_lines.extend(removed_tags or ["(none)"])
        report_lines.append("")

    else:
        report_lines.append("Old formatted swagger not found; only generated formatted file.")

    with diff_report.open("w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"Wrote formatted swagger to: {formatted}")
    print(f"Wrote diff report to: {diff_report}")


if __name__ == "__main__":
    main()





