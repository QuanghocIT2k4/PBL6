import json
import os

def format_json_file(input_file, output_file):
    """Format JSON file with proper indentation"""
    print(f"Đang đọc {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Đang format và lưu vào {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Đã format xong!")

def get_api_details(swagger_data, path, method):
    """Get detailed information about a specific API"""
    if path not in swagger_data.get('paths', {}):
        return None
    
    method_data = swagger_data['paths'][path].get(method.lower(), {})
    if not method_data:
        return None
    
    return {
        'summary': method_data.get('summary', ''),
        'description': method_data.get('description', ''),
        'operationId': method_data.get('operationId', ''),
        'tags': method_data.get('tags', []),
        'parameters': method_data.get('parameters', []),
        'requestBody': method_data.get('requestBody', {}),
        'responses': method_data.get('responses', {}),
        'security': method_data.get('security', [])
    }

def compare_api_details(old_data, new_data, path, method):
    """Compare detailed information of a specific API"""
    old_api = get_api_details(old_data, path, method)
    new_api = get_api_details(new_data, path, method)
    
    if not old_api or not new_api:
        return None
    
    differences = []
    
    # Compare summary
    if old_api['summary'] != new_api['summary']:
        differences.append(f"Summary: '{old_api['summary']}' -> '{new_api['summary']}'")
    
    # Compare parameters
    old_params = {p.get('name'): p for p in old_api['parameters']}
    new_params = {p.get('name'): p for p in new_api['parameters']}
    
    # New parameters
    for param_name in new_params:
        if param_name not in old_params:
            differences.append(f"Parameter mới: {param_name}")
    
    # Removed parameters
    for param_name in old_params:
        if param_name not in new_params:
            differences.append(f"Parameter đã xóa: {param_name}")
    
    # Changed parameters
    for param_name in old_params:
        if param_name in new_params:
            if old_params[param_name] != new_params[param_name]:
                differences.append(f"Parameter thay đổi: {param_name}")
    
    return differences

def main():
    # Format A.json
    input_file = 'node_modules/A.json'
    formatted_file = 'A_formatted.json'
    
    if not os.path.exists(formatted_file):
        format_json_file(input_file, formatted_file)
    else:
        print(f"{formatted_file} đã tồn tại, bỏ qua bước format")
    
    # Load both files
    print("\nĐang so sánh chi tiết các API thay đổi...")
    with open('Swagger_formatted.json', 'r', encoding='utf-8') as f:
        old_data = json.load(f)
    
    with open(formatted_file, 'r', encoding='utf-8') as f:
        new_data = json.load(f)
    
    # Detailed comparison for changed APIs
    changed_apis = [
        ('/api/v1/product-variants/latest', 'GET')
    ]
    
    print("\n" + "="*80)
    print("CHI TIẾT CÁC API THAY ĐỔI:")
    print("="*80)
    
    for path, method in changed_apis:
        print(f"\n{method} {path}")
        print("-"*80)
        differences = compare_api_details(old_data, new_data, path, method)
        if differences:
            for diff in differences:
                print(f"  • {diff}")
        else:
            print("  Không có thay đổi chi tiết")
    
    # Show new APIs details
    new_apis = [
        ('/api/v1/buyer/promotions/store/{storeId}/available', 'GET'),
        ('/api/v1/buyer/promotions/platform/available', 'GET')
    ]
    
    print("\n" + "="*80)
    print("CHI TIẾT CÁC API MỚI:")
    print("="*80)
    
    for path, method in new_apis:
        print(f"\n{method} {path}")
        print("-"*80)
        api_details = get_api_details(new_data, path, method)
        if api_details:
            print(f"  Summary: {api_details['summary']}")
            print(f"  Description: {api_details.get('description', 'N/A')}")
            print(f"  Operation ID: {api_details.get('operationId', 'N/A')}")
            print(f"  Tags: {', '.join(api_details.get('tags', []))}")
            if api_details.get('parameters'):
                print(f"  Parameters: {len(api_details['parameters'])}")
                for param in api_details['parameters']:
                    print(f"    - {param.get('name')} ({param.get('in')}): {param.get('description', 'N/A')}")

if __name__ == '__main__':
    main()


