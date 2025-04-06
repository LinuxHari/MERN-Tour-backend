import envConfig from "../config/envConfig";

const resetPasswordTemplate = (token: string, name: string) => {
  const url = `${envConfig.frontend}/reset-password/${token}`;

  return `<!DOCTYPE html>
<html>
<head>
    <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8f9fa; text-align: center; padding: 20px;">
    <div style="max-width: 600px; background: #ffffff; padding: 20px; border-radius: 10px; margin: auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
    <a href=${envConfig.frontend}>
       <img src="https://firebasestorage.googleapis.com/v0/b/mern-tours-e23a8.appspot.com/o/assets%2Flogo-1.svg?alt=media&amp;token=abbcab85-1eed-4fdd-9ee5-cd4653407341" alt="Viatours" style="display: block;"><span style="font-size: 0.5rem;">Adventure Awaits! Let's Begin</span>
       </a>    
    <div style="text-align: center;">
            <img src="https://firebasestorage.googleapis.com/v0/b/mern-tours-e23a8.appspot.com/o/assets%2Fsuccess.png?alt=media&token=6952e61b-0fbb-4539-94fa-2b2ba40f9e37" alt="mern-tours" style="height:60px;width:60px;"/>
            <h2 style="color: #1d1d1d;">Reset Your Password</h2>
        </div>
        <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #555; font-size: 14px;">We received a request to reset your password. Click the button below to set a new password for your account.</p>
        <a href=${url} style="display: inline-block; background: #ff5722; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; margin: 20px 0;">Reset Password</a>
        <p style="color: #555; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">If the button above does not work, copy and paste this link into your browser:</p>
        <p style="color: #007bff; font-size: 12px; word-break: break-all;">${url}</p>
        <p style="color: #777; font-size: 12px;">&copy; 2025 Your Company. All Rights Reserved.</p>
    </div>
</body>
</html>
`;
};

export default resetPasswordTemplate;
