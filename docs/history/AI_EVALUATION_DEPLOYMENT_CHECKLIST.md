# AI Evaluation Deployment Checklist

**Feature**: AI Evaluation for Session 3  
**Target**: Forge Beta V2  
**Date**: June 18, 2026

---

## Pre-Deployment

### Code Review
- [ ] Review `app/session3.tsx` changes
- [ ] Review `app/session-complete.tsx` changes
- [ ] Review `src/services/ai-evaluation.service.ts`
- [ ] Review `src/services/analytics.service.ts` changes
- [ ] Verify all imports are correct
- [ ] Verify error handling is comprehensive

### TypeScript Verification
- [ ] Run: `npx tsc --noEmit`
- [ ] Confirm: 0 errors
- [ ] Check all modified files for type safety

### Testing
- [ ] Get OpenRouter API key from https://openrouter.ai/keys
- [ ] Add API key to local `.env` file
- [ ] Test happy path (AI evaluation succeeds)
- [ ] Test missing API key scenario
- [ ] Test invalid API key scenario
- [ ] Test network failure scenario
- [ ] Verify XP is always awarded
- [ ] Verify user can always complete session
- [ ] Verify analytics events fire correctly

### Documentation Review
- [ ] Read `AI_EVALUATION_INTEGRATION.md`
- [ ] Read `AI_EVALUATION_TEST_GUIDE.md`
- [ ] Read `AI_EVALUATION_SUMMARY.md`
- [ ] Verify all documentation is accurate
- [ ] Update any outdated information

---

## Environment Setup

### Production Environment Variables

**Required**:
```env
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

**Optional** (defaults to free model):
```env
EXPO_PUBLIC_OPENROUTER_MODEL=openai/gpt-oss-20b:free
```

### Configuration Steps
- [ ] Obtain OpenRouter API key for production
- [ ] Add `EXPO_PUBLIC_OPENROUTER_API_KEY` to production environment
- [ ] Decide on model: Free (`openai/gpt-oss-20b:free`) or Paid (`anthropic/claude-3.5-sonnet`)
- [ ] If paid model: Set `EXPO_PUBLIC_OPENROUTER_MODEL`
- [ ] If paid model: Set up billing alerts on OpenRouter
- [ ] Document API key location in secure vault

---

## Deployment

### Code Deployment
- [ ] Merge feature branch to main
- [ ] Tag release: `beta-v2-ai-evaluation`
- [ ] Deploy to staging environment
- [ ] Smoke test on staging
- [ ] Deploy to production environment

### Post-Deployment Verification
- [ ] Test Session 3 on production
- [ ] Verify AI evaluation works
- [ ] Check analytics events in console
- [ ] Confirm XP awarded correctly
- [ ] Test error handling (temporarily remove API key)
- [ ] Verify completion screen displays AI feedback

---

## Monitoring Setup

### Analytics Dashboard
- [ ] Add `ai_evaluation_started` event to dashboard
- [ ] Add `ai_evaluation_completed` event to dashboard
- [ ] Add `ai_evaluation_failed` event to dashboard
- [ ] Create chart: AI evaluation success rate over time
- [ ] Create chart: Average AI evaluation duration
- [ ] Create chart: AI evaluation failure reasons

### Alerts
- [ ] Alert: AI evaluation failure rate > 5%
- [ ] Alert: Average AI evaluation duration > 5 seconds
- [ ] Alert: AI evaluation timeout rate > 3%
- [ ] Alert: OpenRouter API budget exceeded (if paid model)

### Logging
- [ ] Confirm AI evaluation logs appear in production
- [ ] Verify API key is NOT logged
- [ ] Verify user responses are NOT logged
- [ ] Set up log aggregation for AI evaluation errors

---

## Communication

### Internal Team
- [ ] Notify product team: Feature deployed
- [ ] Notify QA team: Ready for testing
- [ ] Notify support team: Update support docs
- [ ] Notify DevOps team: Monitor alerts
- [ ] Share documentation links with team

### User Communication
- [ ] Prepare announcement: "AI feedback now available"
- [ ] Update app changelog
- [ ] Prepare support FAQ: "What is AI evaluation?"
- [ ] Prepare support FAQ: "Why don't I see AI feedback?"

### Support Team Preparation
- [ ] Train support team on AI evaluation feature
- [ ] Share troubleshooting guide
- [ ] Document common user questions
- [ ] Set up escalation path for technical issues

---

## Beta Testing

### User Feedback Collection
- [ ] Add in-app feedback prompt: "Was AI feedback helpful?"
- [ ] Track feedback responses in analytics
- [ ] Set up user interviews for detailed feedback
- [ ] Monitor user retention with vs. without AI feedback

### Metrics to Track
- [ ] AI evaluation success rate (target: > 95%)
- [ ] Average evaluation duration (target: < 5 seconds)
- [ ] User satisfaction with AI feedback
- [ ] Day 0 completion rate (with vs. without AI)
- [ ] Day 1 return rate (with vs. without AI)
- [ ] Day 7 retention rate (with vs. without AI)

### A/B Testing (Optional)
- [ ] Set up A/B test: 50% users with AI, 50% without
- [ ] Compare retention metrics
- [ ] Compare user satisfaction scores
- [ ] Make data-driven decision on full rollout

---

## Issue Response Plan

### If AI Evaluation Fails Frequently
**Symptoms**: `ai_evaluation_failed` event rate > 5%

**Actions**:
1. Check OpenRouter service status: https://status.openrouter.ai/
2. Review error logs for patterns
3. Verify API key is valid
4. Check if timeout is too aggressive (increase from 45s)
5. Test API manually with cURL
6. Contact OpenRouter support if needed

### If AI Evaluation is Slow
**Symptoms**: Average duration > 5 seconds

**Actions**:
1. Check if free model is bottlenecked
2. Consider upgrading to paid model
3. Reduce max_tokens if responses are verbose
4. Monitor OpenRouter status for performance issues

### If AI Feedback Quality is Poor
**Symptoms**: User feedback indicates unhelpful AI responses

**Actions**:
1. Review actual AI responses in logs
2. Consider upgrading to paid model (better quality)
3. Refine system prompt in `ai-evaluation.service.ts`
4. Add more context to user prompt
5. Test with different models
6. Gather specific user examples for improvement

### If Cost Exceeds Budget
**Symptoms**: OpenRouter bill higher than expected

**Actions**:
1. Check usage on OpenRouter dashboard
2. Verify model is correct (free vs. paid)
3. Review number of evaluations per day
4. Consider switching to free model temporarily
5. Set up usage limits on OpenRouter
6. Implement rate limiting if needed

---

## Rollback Plan

### If Critical Issue Occurs

**Immediate Action**:
1. Remove `EXPO_PUBLIC_OPENROUTER_API_KEY` from production environment
2. Restart app instances to pick up environment change

**Result**:
- AI evaluation gracefully degrades
- Users complete sessions normally
- No code deployment needed
- XP still awarded
- No user disruption

**Recovery**:
1. Fix identified issue
2. Test fix in staging
3. Re-add API key to production
4. Monitor for 24 hours
5. If stable, resume normal operation

---

## Success Criteria

### Technical Success
- [ ] AI evaluation success rate > 95%
- [ ] Average evaluation duration < 5 seconds
- [ ] Zero user-facing errors from AI failures
- [ ] All analytics events tracking correctly

### User Success
- [ ] Positive user feedback on AI quality
- [ ] Users understand strengths/improvements
- [ ] Users find feedback actionable
- [ ] No user complaints about AI blocking progress

### Business Success
- [ ] Day 0 completion rate improves or maintains
- [ ] Day 1 return rate improves
- [ ] Day 7 retention rate improves
- [ ] User satisfaction scores increase

---

## Post-Launch Review (1 Week)

### Data Analysis
- [ ] Review AI evaluation success rate
- [ ] Review average evaluation duration
- [ ] Review failure reasons
- [ ] Review user feedback
- [ ] Review retention metrics

### Decision Points
- [ ] Keep free model or upgrade to paid?
- [ ] Adjust timeout settings?
- [ ] Refine system prompt?
- [ ] Add per-question feedback?
- [ ] Expand to other sessions?

### Documentation Updates
- [ ] Update docs based on learnings
- [ ] Document common issues and solutions
- [ ] Update support FAQs
- [ ] Share best practices with team

---

## Sign-Off

**Development Lead**: _______________ Date: ___________  
**QA Lead**: _______________ Date: ___________  
**Product Manager**: _______________ Date: ___________  
**DevOps Lead**: _______________ Date: ___________

---

## Quick Reference

**Documentation**:
- Technical: `AI_EVALUATION_INTEGRATION.md`
- Testing: `AI_EVALUATION_TEST_GUIDE.md`
- Overview: `AI_EVALUATION_SUMMARY.md`
- Deployment: `AI_EVALUATION_DEPLOYMENT_CHECKLIST.md` (this file)

**Environment Variables**:
- `EXPO_PUBLIC_OPENROUTER_API_KEY` — Required for AI
- `EXPO_PUBLIC_OPENROUTER_MODEL` — Optional (defaults to free model)

**Free Model**: `openai/gpt-oss-20b:free` ($0.00)  
**Paid Model**: `anthropic/claude-3.5-sonnet` (~$0.0045/eval)

**OpenRouter**:
- Dashboard: https://openrouter.ai/
- API Keys: https://openrouter.ai/keys
- Status: https://status.openrouter.ai/
- Docs: https://openrouter.ai/docs

**Support Contact**: Development team for issues

---

**Checklist Version**: 1.0  
**Last Updated**: June 18, 2026  
**Status**: Ready for Deployment
