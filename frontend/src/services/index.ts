/**
 * Services - Point d'entrée centralisé
 * =====================================
 * Exporte tous les services pour faciliter les imports
 */

// Configuration API
export * from './api.config';

// Services
export { AuthService } from './authService';
export { ActivityService } from './activityService';
export { ContentService } from './contentService';
export { LeadersService } from './leadersService';
export { DatesService } from './datesService';
export { StatsService } from './statsService';
export { LikeService } from './likeService';
export { SpecialiteService } from './specialiteService';
export { ProfileService } from './profileService';
export { LaureatsService } from './laureatsService';
export { DashboardService } from './dashboardService';
export { NotificationService } from './notificationService';
export { ActivityProposalService } from './activityProposalService';
export { VoteService } from './voteService';
