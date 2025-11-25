"""
Email service for sending emails via mail.bionicaisolutions.com API
"""
import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to: list[str],
    subject: str,
    body: str,
    body_type: str = "html",
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    cc: Optional[list[str]] = None,
    bcc: Optional[list[str]] = None,
) -> tuple[bool, Optional[str]]:
    """
    Send email via mail.bionicaisolutions.com API
    
    Args:
        to: List of recipient email addresses
        subject: Email subject
        body: Email body content
        body_type: 'text' or 'html' (default: 'html')
        from_email: Sender email (optional)
        from_name: Sender name (optional)
        cc: CC recipients (optional)
        bcc: BCC recipients (optional)
    
    Returns:
        Tuple of (success: bool, error_message: Optional[str])
    """
    mail_api_url = getattr(settings, 'MAIL_API_URL', 'https://mail.bionicaisolutions.com')
    mail_api_key = getattr(settings, 'MAIL_API_KEY', '')
    
    if not mail_api_key:
        logger.warning("MAIL_API_KEY not configured, skipping email send")
        return False, "Mail API key not configured"
    
    try:
        payload = {
            "to": to,
            "subject": subject,
            "body": body,
            "body_type": body_type,
        }
        
        if from_email:
            payload["from_email"] = from_email
        if from_name:
            payload["from_name"] = from_name
        if cc:
            payload["cc"] = cc
        if bcc:
            payload["bcc"] = bcc
        
        headers = {
            "Authorization": f"Bearer {mail_api_key}",
            "Content-Type": "application/json",
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{mail_api_url}/send-email",
                json=payload,
                headers=headers,
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    logger.info(f"Email sent successfully to {to}")
                    return True, None
                else:
                    error = result.get("error", "Unknown error")
                    logger.error(f"Failed to send email: {error}")
                    return False, error
            else:
                error = f"Mail API returned status {response.status_code}: {response.text}"
                logger.error(error)
                return False, error
                
    except httpx.TimeoutException:
        error = "Mail API request timed out"
        logger.error(error)
        return False, error
    except Exception as e:
        error = f"Failed to send email: {str(e)}"
        logger.error(error, exc_info=True)
        return False, error


async def send_registration_email(user_email: str, user_name: str) -> bool:
    """
    Send registration confirmation email to new user
    
    Args:
        user_email: User's email address
        user_name: User's full name
    
    Returns:
        True if email sent successfully, False otherwise
    """
    subject = "Registration Successful - Awaiting Admin Approval"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Welcome to the Multilingual Meeting Platform!</h2>
            
            <p>Dear {user_name},</p>
            
            <p>Thank you for registering with the Multilingual Meeting Platform. Your account has been created successfully.</p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Important:</strong> Your account is currently pending admin approval. 
                You will receive an email notification once an administrator has approved your account.</p>
            </div>
            
            <p>Once approved, you will be able to:</p>
            <ul>
                <li>Login to the platform</li>
                <li>Join meetings</li>
                <li>Participate in multilingual conversations</li>
                <li>Access all platform features</li>
            </ul>
            
            <p>We appreciate your patience during the approval process.</p>
            
            <p>Best regards,<br>
            The Multilingual Meeting Platform Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </body>
    </html>
    """
    
    success, error = await send_email(
        to=[user_email],
        subject=subject,
        body=body,
        body_type="html",
        from_name="Multilingual Meeting Platform",
    )
    
    return success


async def send_approval_email(user_email: str, user_name: str, approved: bool) -> bool:
    """
    Send approval/rejection email to user
    
    Args:
        user_email: User's email address
        user_name: User's full name
        approved: True if approved, False if rejected
    
    Returns:
        True if email sent successfully, False otherwise
    """
    if approved:
        subject = "Account Approved - Welcome to the Platform!"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4CAF50;">Account Approved!</h2>
                
                <p>Dear {user_name},</p>
                
                <p>Great news! Your account has been approved by an administrator.</p>
                
                <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Your account is now active!</strong> You can now login and start using the platform.</p>
                </div>
                
                <p>You can now:</p>
                <ul>
                    <li>Login to the platform using your registered email and password</li>
                    <li>Join meetings and participate in conversations</li>
                    <li>Enjoy multilingual translation features</li>
                    <li>Access all platform features</li>
                </ul>
                
                <p style="margin-top: 30px;">
                    <a href="https://meet.bionicaisolutions.com/login" 
                       style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Login Now
                    </a>
                </p>
                
                <p>We look forward to seeing you on the platform!</p>
                
                <p>Best regards,<br>
                The Multilingual Meeting Platform Team</p>
            </div>
        </body>
        </html>
        """
    else:
        subject = "Account Registration - Additional Information Required"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc3545;">Account Registration Update</h2>
                
                <p>Dear {user_name},</p>
                
                <p>Thank you for your interest in the Multilingual Meeting Platform.</p>
                
                <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0;">
                    <p style="margin: 0;">Unfortunately, your account registration could not be approved at this time.</p>
                </div>
                
                <p>If you believe this is an error or would like more information, please contact the platform administrator.</p>
                
                <p>Best regards,<br>
                The Multilingual Meeting Platform Team</p>
            </div>
        </body>
        </html>
        """
    
    success, error = await send_email(
        to=[user_email],
        subject=subject,
        body=body,
        body_type="html",
        from_name="Multilingual Meeting Platform",
    )
    
    return success


