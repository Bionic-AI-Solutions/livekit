#!/usr/bin/env python3
"""
Generate JWT token for mail.bionicaisolutions.com API

This script generates a JWT token that can be used as the MAIL_API_KEY
for authenticating with the mail service API.

Usage:
    python3 generate-mail-api-token.py

The generated token can be used as:
    MAIL_API_KEY=<generated_token>
"""
import sys
import time
from datetime import datetime, timedelta

try:
    from jose import jwt
except ImportError:
    print("ERROR: python-jose is required. Install it with:")
    print("  pip install python-jose[cryptography]")
    sys.exit(1)

# JWT Configuration from mail service
JWT_SECRET = "mail-jwt-secret-key-2024-secure-token-12345"
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "mail-service-jwt-key"  # This is the 'iss' claim value

def generate_token(expires_in_days=365):
    """Generate a JWT token for mail service API"""
    # Create payload
    now = datetime.utcnow()
    exp = now + timedelta(days=expires_in_days)
    
    payload = {
        "iss": JWT_ISSUER,  # Issuer must match jwt_key in mail service config
        "iat": int(now.timestamp()),  # Issued at
        "exp": int(exp.timestamp()),  # Expiration
    }
    
    # Generate token
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return token, exp

if __name__ == "__main__":
    print("=" * 60)
    print("Mail Service API Token Generator")
    print("=" * 60)
    print()
    
    token, expiration = generate_token()
    
    print("Generated JWT Token:")
    print("-" * 60)
    print(token)
    print("-" * 60)
    print()
    print(f"Expires: {expiration.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print()
    print("Use this token as MAIL_API_KEY in your backend configuration:")
    print(f"  MAIL_API_KEY={token}")
    print()
    print("Or add it to your Kubernetes secret:")
    print(f"  kubectl create secret generic mail-api-key \\")
    print(f"    --from-literal=MAIL_API_KEY='{token}' \\")
    print(f"    -n meeting-platform")
    print()


