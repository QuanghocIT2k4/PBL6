import json
from pathlib import Path


def main():
    project_root = Path(__file__).resolve().parent.parent
    src = project_root / "Swagger1412.json"
    formatted = project_root / "Swagger1412_formatted.json"
    diff_report = project_root / "Swagger1412_vs_1312_diff.txt"
    old = project_root / "Swagger1312_formatted.json"

    if not src.exists():
        raise FileNotFoundError(f"Source swagger not found: {src}")

    # Pretty print new swagger
    print(f"Reading {src}...")
    with src.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"Writing formatted swagger to {formatted}...")
    with formatted.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    report_lines = []
    report_lines.append("=" * 80)
    report_lines.append("SO SÁNH SWAGGER 14/12/2024 vs 13/12/2024")
    report_lines.append("=" * 80)
    report_lines.append("")
    
    if old.exists():
        print(f"Comparing with {old}...")
        with old.open("r", encoding="utf-8") as f:
            old_data = json.load(f)

        def path_set(swagger: dict) -> set[str]:
            return set(swagger.get("paths", {}).keys())

        new_paths = path_set(data)
        old_paths = path_set(old_data)
        added = sorted(new_paths - old_paths)
        removed = sorted(old_paths - new_paths)

        report_lines.append("### ✅ API PATHS MỚI ĐƯỢC THÊM (14/12)")
        if added:
            for path in added:
                # Get method info
                path_info = data.get("paths", {}).get(path, {})
                methods = [m.upper() for m in path_info.keys() if m in ['get', 'post', 'put', 'delete', 'patch']]
                method_str = ", ".join(methods) if methods else ""
                report_lines.append(f"  + {path} [{method_str}]")
        else:
            report_lines.append("  (không có)")
        report_lines.append("")
        
        report_lines.append("### ❌ API PATHS BỊ XÓA (so với 13/12)")
        if removed:
            for path in removed:
                report_lines.append(f"  - {path}")
        else:
            report_lines.append("  (không có)")
        report_lines.append("")

        # Check specific changes mentioned in Trello
        report_lines.append("### 🔍 KIỂM TRA THAY ĐỔI THEO TRELLO:")
        report_lines.append("")
        
        # 1. Check if PUT /api/v1/b2c/shipments/{shipmentId}/status was removed
        removed_status_path = "/api/v1/b2c/shipments/{shipmentId}/status"
        if removed_status_path in removed:
            report_lines.append("  ✅ ĐÃ XÓA: PUT /api/v1/b2c/shipments/{shipmentId}/status")
        elif removed_status_path in old_paths:
            report_lines.append("  ⚠️ CHƯA XÓA: PUT /api/v1/b2c/shipments/{shipmentId}/status (vẫn còn trong 14/12)")
        else:
            report_lines.append("  ℹ️ KHÔNG TỒN TẠI: PUT /api/v1/b2c/shipments/{shipmentId}/status (không có trong 13/12)")
        report_lines.append("")
        
        # 2. Check if POST /api/v1/b2c/shipments/order/{orderId} was added
        post_shipment_path = "/api/v1/b2c/shipments/order/{orderId}"
        if post_shipment_path in added:
            path_info = data.get("paths", {}).get(post_shipment_path, {})
            if "post" in path_info:
                report_lines.append("  ✅ ĐÃ THÊM: POST /api/v1/b2c/shipments/order/{orderId}")
            else:
                report_lines.append("  ⚠️ PATH CÓ NHƯNG KHÔNG CÓ POST: /api/v1/b2c/shipments/order/{orderId}")
        elif post_shipment_path in new_paths:
            path_info = data.get("paths", {}).get(post_shipment_path, {})
            if "post" in path_info:
                report_lines.append("  ℹ️ ĐÃ CÓ SẴN: POST /api/v1/b2c/shipments/order/{orderId} (có trong cả 13/12 và 14/12)")
            else:
                report_lines.append("  ⚠️ PATH CÓ NHƯNG KHÔNG CÓ POST: /api/v1/b2c/shipments/order/{orderId}")
        else:
            report_lines.append("  ❌ CHƯA THÊM: POST /api/v1/b2c/shipments/order/{orderId}")
        report_lines.append("")
        
        # 3. Check for ReturnRequest related APIs
        return_request_paths = [p for p in new_paths if "return" in p.lower() or "refund" in p.lower()]
        if return_request_paths:
            report_lines.append("  ✅ TÌM THẤY CÁC API LIÊN QUAN ĐẾN RETURN/REFUND:")
            for path in sorted(return_request_paths):
                path_info = data.get("paths", {}).get(path, {})
                methods = [m.upper() for m in path_info.keys() if m in ['get', 'post', 'put', 'delete', 'patch']]
                method_str = ", ".join(methods) if methods else ""
                report_lines.append(f"    - {path} [{method_str}]")
        else:
            report_lines.append("  ⚠️ CHƯA TÌM THẤY: Các API liên quan đến ReturnRequest")
        report_lines.append("")

        # Added tags
        def tag_set(swagger: dict) -> set[str]:
            return {t.get("name", "") for t in swagger.get("tags", [])}

        new_tags = tag_set(data)
        old_tags = tag_set(old_data)
        added_tags = sorted(new_tags - old_tags)
        removed_tags = sorted(old_tags - new_tags)
        
        report_lines.append("### ✅ TAGS MỚI ĐƯỢC THÊM")
        if added_tags:
            for tag in added_tags:
                report_lines.append(f"  + {tag}")
        else:
            report_lines.append("  (không có)")
        report_lines.append("")
        
        report_lines.append("### ❌ TAGS BỊ XÓA")
        if removed_tags:
            for tag in removed_tags:
                report_lines.append(f"  - {tag}")
        else:
            report_lines.append("  (không có)")
        report_lines.append("")

        # Check for ReturnRequest tag
        return_tags = [t for t in new_tags if "return" in t.lower() or "refund" in t.lower()]
        if return_tags:
            report_lines.append("  ✅ TÌM THẤY TAG LIÊN QUAN ĐẾN RETURN:")
            for tag in return_tags:
                report_lines.append(f"    - {tag}")
        else:
            report_lines.append("  ⚠️ CHƯA TÌM THẤY: Tag liên quan đến ReturnRequest")
        report_lines.append("")
        
        # Compare servers
        new_servers = data.get("servers", [])
        old_servers = old_data.get("servers", [])
        report_lines.append("### 🌐 SERVERS")
        report_lines.append("14/12 Servers:")
        for server in new_servers:
            report_lines.append(f"  - {server.get('url')} ({server.get('description', '')})")
        report_lines.append("")
        report_lines.append("13/12 Servers:")
        for server in old_servers:
            report_lines.append(f"  - {server.get('url')} ({server.get('description', '')})")
        report_lines.append("")
        
        # Summary
        report_lines.append("=" * 80)
        report_lines.append("TÓM TẮT:")
        report_lines.append(f"  - Tổng số paths (14/12): {len(new_paths)}")
        report_lines.append(f"  - Tổng số paths (13/12): {len(old_paths)}")
        report_lines.append(f"  - Paths mới thêm: {len(added)}")
        report_lines.append(f"  - Paths bị xóa: {len(removed)}")
        report_lines.append(f"  - Tổng số tags (14/12): {len(new_tags)}")
        report_lines.append(f"  - Tổng số tags (13/12): {len(old_tags)}")
        report_lines.append(f"  - Tags mới thêm: {len(added_tags)}")
        report_lines.append(f"  - Tags bị xóa: {len(removed_tags)}")
        report_lines.append("=" * 80)

    else:
        report_lines.append("⚠️ Không tìm thấy Swagger1312_formatted.json để so sánh")
        report_lines.append("Chỉ tạo file formatted.")

    with diff_report.open("w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"✅ Đã tạo file formatted: {formatted}")
    print(f"✅ Đã tạo báo cáo so sánh: {diff_report}")


if __name__ == "__main__":
    main()


