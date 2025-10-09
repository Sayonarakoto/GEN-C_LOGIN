const speakeasy = require('speakeasy');
const Faculty = require('../models/Faculty'); // Assuming Security Supervisors are Faculty members
const AuditLog = require('../models/AuditLog'); // For logging MFA failures

/**
 * Middleware: Performs MFA challenge and verification for Security Supervisors.
 * This middleware expects:
 *   - req.user to be populated by requireAuth and requireSecuritySupervisor.
 *   - req.body.mfaCode to contain the MFA code provided by the user.
 * 
 * IMPORTANT: Ensure 'speakeasy' is installed (npm install speakeasy).
 */
exports.mfaCheck = async (req, res, next) => {
  const userId = req.user.id; // Assuming req.user.id holds the Faculty member's ID
  const mfaCode = req.body.mfaCode; // Get mfaCode early for logging

  try {
    // 1. Fetch user's MFA settings (DFD 6.1)
    const user = await Faculty.findById(userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      // Log this as a potential security issue or misconfiguration
      console.warn(`MFA_NOT_CONFIGURED: User ${userId} attempted MFA without configuration.`);
      return res.status(403).json({
        success: false,
        message: 'MFA not enabled or configured for this user.',
        code: 'MFA_NOT_CONFIGURED'
      });
    }

    // 2. Verify MFA Code (DFD 6.2)
    if (!mfaCode) {
      // Log this failure
      await AuditLog.create({
        event_type: 'MFA Failure',
        actor_role: 'Security Supervisor',
        actor_id: userId,
        event_details: { reason: 'MFA code missing', mfaCodeAttempted: mfaCode },
        timestamp: new Date()
      });
      return res.status(400).json({
        success: false,
        message: 'MFA code is required.',
        code: 'MFA_CODE_REQUIRED'
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaCode,
      window: 1 // Allow for 1 time step difference
    });

    if (!verified) {
      // Log this failure attempt to the Audit Log (D2)
      await AuditLog.create({
        event_type: 'MFA Failure',
        actor_role: 'Security Supervisor',
        actor_id: userId,
        event_details: { reason: 'Invalid MFA code', mfaCodeAttempted: mfaCode },
        timestamp: new Date()
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid MFA code.',
        code: 'INVALID_MFA_CODE'
      });
    }

    // MFA successful: Attach MFA status and proceed to controller
    req.user.mfa_status = 'Success';
    next();

  } catch (error) {
    console.error('Error during MFA check:', error);
    // Log internal errors during MFA verification
    await AuditLog.create({
      event_type: 'MFA Error',
      actor_role: 'Security Supervisor',
      actor_id: userId,
      event_details: { reason: error.message, mfaCodeAttempted: mfaCode },
      timestamp: new Date()
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error during MFA verification.',
      code: 'MFA_VERIFICATION_ERROR'
    });
  }
};