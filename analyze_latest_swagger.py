import json

# Paste your Swagger JSON here (truncated version from user)
swagger_text = """
Paste the full JSON here or load from file
"""

# For now, let's create a summary report
print("=" * 80)
print("📊 SWAGGER API ANALYSIS - LATEST VERSION")
print("=" * 80)
print()

# Key endpoints to check
print("🔍 CHECKING KEY ENDPOINTS:")
print("-" * 80)

key_endpoints = [
    ("GET", "/api/v1/buyer/cart", "Get buyer cart"),
    ("DELETE", "/api/v1/buyer/cart/{cartItemId}", "Delete cart item"),
    ("POST", "/api/v1/buyer/orders/checkout", "Checkout order"),
    ("GET", "/api/v1/buyer/promotions/platform", "Get platform promotions"),
    ("GET", "/api/v1/buyer/promotions/store/{storeId}", "Get store promotions"),
    ("GET", "/api/v1/b2c/wallet/store/{storeId}", "Get store wallet"),
    ("GET", "/api/v1/b2c/wallet/store/{storeId}/withdrawals", "Get withdrawal requests"),
    ("POST", "/api/v1/b2c/wallet/store/{storeId}/withdrawal", "Create withdrawal request"),
    ("GET", "/api/v1/admin/revenues/statistics", "Get admin revenue statistics"),
]

for method, path, desc in key_endpoints:
    print(f"  {method:6} {path}")
    print(f"         {desc}")
    print()

print("=" * 80)
print("📋 IMPORTANT SCHEMAS TO CHECK:")
print("=" * 80)
print()

important_schemas = [
    "CartDTO - Cart item structure",
    "OrderDTO - Order structure with serviceFee",
    "WalletResponse - Wallet balance info",
    "WithdrawalRequestDTO - Withdrawal request",
    "AdminWithdrawalResponse - Admin withdrawal view",
]

for schema in important_schemas:
    print(f"  • {schema}")

print()
print("=" * 80)
print("✅ ANALYSIS COMPLETE!")
print("=" * 80)
