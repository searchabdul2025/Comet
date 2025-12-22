import BonusRule from '@/models/BonusRule';
import FormSubmission from '@/models/FormSubmission';
import { getSetting } from '@/lib/settings';
import mongoose from 'mongoose';

interface BonusConfig {
  perSubmission: number;
  onTarget: number;
}

interface CalculateBonusParams {
  userId: string | mongoose.Types.ObjectId;
  campaignId?: string | mongoose.Types.ObjectId;
  period: string;
  achieved: number;
  target?: number;
}

function getMonthRange(period: string) {
  const [yearStr, monthStr] = period.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

async function loadBonusConfig(): Promise<BonusConfig> {
  const [perSubmission, onTarget] = await Promise.all([
    getSetting('BONUS_PER_SUBMISSION'),
    getSetting('BONUS_TARGET_BONUS'),
  ]);
  return {
    perSubmission: Number(perSubmission || 0),
    onTarget: Number(onTarget || 0),
  };
}

/**
 * Calculate bonus using granular bonus rules (per user, campaign, product grade)
 * Falls back to global settings if no specific rules exist
 */
export async function calculateGranularBonus(params: CalculateBonusParams): Promise<number> {
  const { userId, campaignId, period, achieved, target } = params;
  const { start, end } = getMonthRange(period);

  const userIdObj = typeof userId === 'string' 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;

  // If campaignId is provided, try to use granular bonus rules
  if (campaignId) {
    const campaignIdObj = typeof campaignId === 'string'
      ? new mongoose.Types.ObjectId(campaignId)
      : campaignId;

    // Get all active bonus rules for this user and campaign
    const bonusRules = await BonusRule.find({
      user: userIdObj,
      campaign: campaignIdObj,
      isActive: true,
    }).lean();

    if (bonusRules.length > 0) {
      // Calculate bonus based on product grades
      let totalBonus = 0;

      // Get forms for this campaign
      const Form = (await import('@/models/Form')).default;
      const campaignForms = await Form.find({ campaign: campaignIdObj }).select('_id').lean();
      const formIds = campaignForms.map((f: any) => f._id);

      if (formIds.length > 0) {
        // Get all submissions for this campaign (with and without productGrade)
        const allCampaignSubmissions = await FormSubmission.countDocuments({
          submittedBy: userIdObj,
          formId: { $in: formIds },
          createdAt: { $gte: start, $lte: end },
        });

        // Get submissions grouped by product grade for this period and campaign
        const submissionsByGrade = await FormSubmission.aggregate([
          {
            $match: {
              submittedBy: userIdObj,
              formId: { $in: formIds },
              createdAt: { $gte: start, $lte: end },
              productGrade: { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: '$productGrade',
              count: { $sum: 1 },
            },
          },
        ]);

        // Calculate bonus for each product grade
        let submissionsWithGrade = 0;
        for (const rule of bonusRules) {
          const gradeSubmission = submissionsByGrade.find(
            (s: any) => s._id?.toLowerCase() === rule.productGrade.toLowerCase()
          );
          const count = gradeSubmission?.count || 0;
          submissionsWithGrade += count;

          // Apply bonus: count * bonusAmount
          totalBonus += count * rule.bonusAmount;

          // If rule has a target and achieved it, add target bonus (if applicable)
          if (rule.target && count >= rule.target && target && achieved >= target) {
            // This could be enhanced further if needed
          }
        }

        // Handle submissions without productGrade using global settings
        const submissionsWithoutGrade = allCampaignSubmissions - submissionsWithGrade;
        if (submissionsWithoutGrade > 0) {
          const bonusCfg = await loadBonusConfig();
          totalBonus += submissionsWithoutGrade * bonusCfg.perSubmission;
        }
      }

      // Also check if overall target is met for on-target bonus
      const bonusCfg = await loadBonusConfig();
      if (target && achieved >= target && bonusCfg.onTarget > 0) {
        totalBonus += bonusCfg.onTarget;
      }

      return totalBonus;
    }
  }

  // Fall back to global bonus calculation
  const bonusCfg = await loadBonusConfig();
  let bonus = achieved * bonusCfg.perSubmission;
  
  if (target && achieved >= target) {
    bonus += bonusCfg.onTarget;
  }

  return bonus;
}

/**
 * Calculate bonus for multiple campaigns (aggregate)
 */
export async function calculateBonusForUser(
  userId: string | mongoose.Types.ObjectId,
  period: string,
  target?: number
): Promise<number> {
  const { start, end } = getMonthRange(period);
  const userIdObj = typeof userId === 'string' 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;

  // Get all submissions for the period
  const submissions = await FormSubmission.find({
    submittedBy: userIdObj,
    createdAt: { $gte: start, $lte: end },
  })
    .populate('formId', 'campaign')
    .lean();

  const achieved = submissions.length;

  // Group submissions by campaign
  const campaignGroups = new Map<string, any[]>();
  for (const sub of submissions) {
    const form = sub.formId as any;
    const campaignId = form?.campaign?._id || form?.campaign;
    if (campaignId) {
      const key = campaignId.toString();
      if (!campaignGroups.has(key)) {
        campaignGroups.set(key, []);
      }
      campaignGroups.get(key)!.push(sub);
    }
  }

  let totalBonus = 0;

  // Calculate bonus for each campaign using granular rules
  for (const [campaignId, campaignSubmissions] of campaignGroups) {
    const campaignBonus = await calculateGranularBonus({
      userId: userIdObj,
      campaignId,
      period,
      achieved: campaignSubmissions.length,
      target,
    });
    totalBonus += campaignBonus;
  }

  // Handle submissions without campaigns using global settings
  const submissionsWithoutCampaign = submissions.filter((sub: any) => {
    const form = sub.formId as any;
    return !form?.campaign?._id && !form?.campaign;
  });

  if (submissionsWithoutCampaign.length > 0) {
    const bonusCfg = await loadBonusConfig();
    totalBonus += submissionsWithoutCampaign.length * bonusCfg.perSubmission;
  }

  // Add on-target bonus if overall target is met
  if (target && achieved >= target) {
    const bonusCfg = await loadBonusConfig();
    totalBonus += bonusCfg.onTarget;
  }

  return totalBonus;
}

