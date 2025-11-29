# Resend Email Verification - Step by Step

## Choose: "I don't own a domain"

Since you don't have a domain, choose this option.

## Steps:

### 1. Choose "I don't own a domain"
- Click on **"I don't own a domain"** option in Resend
- This allows you to verify a specific email address instead of a whole domain

### 2. Enter Your Email Address
- Enter an email address you control (e.g., `anvesh.ak.131@gmail.com` or any email you can access)
- This will be your "from" email address

### 3. Verify the Email
- Resend will send a verification email to that address
- Check your inbox (and spam folder)
- Click the verification link in the email

### 4. Set Environment Variable
After verification, set in Cloudflare Pages:
- Variable name: `RESEND_FROM_ADDRESS`
- Value: `SportsUP <anvesh.ak.131@gmail.com>` (use the email you verified)
- Save and redeploy

### 5. Test
- Try sending an email from Email Notifications page
- If it works → Great! 
- If limited to account owner only → You may need to upgrade or get a domain

## Important Notes:

⚠️ **Email verification may still have limitations:**
- Some free tiers only allow sending to your account owner email
- Test to see if you can send to all users
- If not, you'll need to:
  - Buy a domain ($0.88/year) and verify it, OR
  - Upgrade to a paid Resend plan

## Alternative: Get a Domain (Recommended)

If email verification has limitations, get a cheap domain:

1. Buy from Namecheap: $0.88/year for `.xyz` domain
2. Choose "I own a domain" in Resend
3. Verify the domain
4. Full functionality guaranteed

## Next Steps After Verification

1. Set `RESEND_FROM_ADDRESS` environment variable
2. Redeploy Cloudflare Pages
3. Test sending emails
4. Check if it works for all users

