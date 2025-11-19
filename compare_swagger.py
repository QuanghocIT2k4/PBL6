import json
from collections import defaultdict

# Load both Swagger files
with open('Swagger.json', 'r', encoding='utf-8') as f:
    new_swagger = json.load(f)

with open('Swagger_new_formatted.json', 'r', encoding='utf-8-sig') as f:
    old_swagger = json.load(f)

# Extract paths (endpoints)
new_paths = set(new_swagger.get('paths', {}).keys())
old_paths = set(old_swagger.get('paths', {}).keys())

# Find differences
added_paths = new_paths - old_paths
removed_paths = old_paths - new_paths
common_paths = new_paths & old_paths

print("=" * 80)
print("📊 SWAGGER API COMPARISON REPORT")
print("=" * 80)
print()

# 1. NEW ENDPOINTS
if added_paths:
    print("✅ NEW ENDPOINTS ADDED:")
    print("-" * 80)
    for path in sorted(added_paths):
        methods = new_swagger['paths'][path].keys()
        for method in methods:
            if method in ['get', 'post', 'put', 'delete', 'patch']:
                endpoint_info = new_swagger['paths'][path][method]
                summary = endpoint_info.get('summary', 'No summary')
                tags = endpoint_info.get('tags', ['No tag'])
                print(f"  {method.upper():6} {path}")
                print(f"         Tag: {tags[0]}")
                print(f"         Summary: {summary}")
                print()
else:
    print("✅ NEW ENDPOINTS: None")
    print()

# 2. REMOVED ENDPOINTS
if removed_paths:
    print("❌ REMOVED ENDPOINTS:")
    print("-" * 80)
    for path in sorted(removed_paths):
        methods = old_swagger['paths'][path].keys()
        for method in methods:
            if method in ['get', 'post', 'put', 'delete', 'patch']:
                endpoint_info = old_swagger['paths'][path][method]
                summary = endpoint_info.get('summary', 'No summary')
                print(f"  {method.upper():6} {path}")
                print(f"         Summary: {summary}")
                print()
else:
    print("❌ REMOVED ENDPOINTS: None")
    print()

# 3. MODIFIED ENDPOINTS
print("🔄 MODIFIED ENDPOINTS:")
print("-" * 80)
modified_count = 0

for path in sorted(common_paths):
    old_endpoint = old_swagger['paths'][path]
    new_endpoint = new_swagger['paths'][path]
    
    # Check each HTTP method
    all_methods = set(old_endpoint.keys()) | set(new_endpoint.keys())
    
    for method in all_methods:
        if method not in ['get', 'post', 'put', 'delete', 'patch']:
            continue
            
        if method in old_endpoint and method in new_endpoint:
            old_info = old_endpoint[method]
            new_info = new_endpoint[method]
            
            changes = []
            
            # Check summary
            if old_info.get('summary') != new_info.get('summary'):
                changes.append(f"Summary: '{old_info.get('summary')}' → '{new_info.get('summary')}'")
            
            # Check parameters
            old_params = {p['name']: p for p in old_info.get('parameters', [])}
            new_params = {p['name']: p for p in new_info.get('parameters', [])}
            
            added_params = set(new_params.keys()) - set(old_params.keys())
            removed_params = set(old_params.keys()) - set(new_params.keys())
            
            if added_params:
                changes.append(f"Added params: {', '.join(added_params)}")
            if removed_params:
                changes.append(f"Removed params: {', '.join(removed_params)}")
            
            # Check request body
            old_has_body = 'requestBody' in old_info
            new_has_body = 'requestBody' in new_info
            
            if old_has_body != new_has_body:
                if new_has_body:
                    changes.append("Added request body")
                else:
                    changes.append("Removed request body")
            
            if changes:
                modified_count += 1
                print(f"  {method.upper():6} {path}")
                for change in changes:
                    print(f"         - {change}")
                print()

if modified_count == 0:
    print("  No modifications detected")
    print()

# 4. SUMMARY
print("=" * 80)
print("📈 SUMMARY:")
print("=" * 80)
print(f"  Total endpoints in OLD Swagger: {len(old_paths)}")
print(f"  Total endpoints in NEW Swagger: {len(new_paths)}")
print(f"  Added: {len(added_paths)}")
print(f"  Removed: {len(removed_paths)}")
print(f"  Modified: {modified_count}")
print(f"  Unchanged: {len(common_paths) - modified_count}")
print()

# 5. NEW SCHEMAS
old_schemas = set(old_swagger.get('components', {}).get('schemas', {}).keys())
new_schemas = set(new_swagger.get('components', {}).get('schemas', {}).keys())

added_schemas = new_schemas - old_schemas
removed_schemas = old_schemas - new_schemas

if added_schemas or removed_schemas:
    print("=" * 80)
    print("📦 SCHEMA CHANGES:")
    print("=" * 80)
    if added_schemas:
        print(f"  ✅ Added schemas: {', '.join(sorted(added_schemas))}")
    if removed_schemas:
        print(f"  ❌ Removed schemas: {', '.join(sorted(removed_schemas))}")
    print()

print("=" * 80)
print("✅ COMPARISON COMPLETE!")
print("=" * 80)
