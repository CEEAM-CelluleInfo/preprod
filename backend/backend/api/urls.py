"""
URLs API - Plateforme CEEAM
"""

from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from . import views

# Router pour les ViewSets (slash optionnel)
routeur = DefaultRouter(trailing_slash="/?")
routeur.register(r"countries", views.CountryViewSet, basename="countries")
routeur.register(r"specialites", views.SpecialiteViewSet, basename="specialites")
routeur.register(r"content", views.ContentSectionViewSet, basename="content-sections")
routeur.register(r"dates", views.AcademicDateViewSet, basename="academic-dates")
routeur.register(r"activities", views.ActivityViewSet, basename="activities")
routeur.register(r"leaders", views.BureauMemberViewSet, basename="bureau-members")
routeur.register(r"historical-sg", views.HistoricalSGViewSet, basename="historical-sg")
routeur.register(r"proposals", views.ActivityProposalViewSet, basename="activity-proposals")
routeur.register(r"clubs", views.ClubViewSet, basename="clubs")

app_name = 'api'

urlpatterns = [
    # ====================================================
    # ENDPOINTS D'AUTHENTIFICATION DE BASE
    # ====================================================
    
    # POST /api/auth/register/ - Inscription d'un nouvel utilisateur
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    
    # POST /api/auth/login/ - Connexion avec email et password
    path('auth/login/', views.LoginView.as_view(), name='login'),
    
    # POST /api/auth/logout/ - Déconnexion et blacklist du refresh token
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    
    # POST /api/auth/refresh/ - Rafraîchir l'access token
    path('auth/refresh/', views.RefreshTokenView.as_view(), name='refresh'),
    
    # GET /api/auth/me/ - Récupérer les infos de l'utilisateur connecté
    path('auth/me/', views.MeView.as_view(), name='me'),
    
    # ====================================================
    # ENDPOINTS EMAIL VERIFICATION
    # ====================================================
    
    # POST /api/auth/verify-email/ - Vérifier l'email avec un token
    path('auth/verify-email/', views.EmailVerificationView.as_view(), name='verify_email'),
    
    # POST /api/auth/resend-verification/ - Renvoyer l'email de vérification
    path('auth/resend-verification/', views.ResendVerificationEmailView.as_view(), name='resend_verification'),
    
    # ====================================================
    # ENDPOINTS PASSWORD RESET
    # ====================================================
    
    # POST /api/auth/forgot-password/ - Demander une réinitialisation du mot de passe
    path('auth/forgot-password/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    
    # POST /api/auth/reset-password/ - Confirmer la réinitialisation du mot de passe
    path('auth/reset-password/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # POST /api/auth/change-password/ - Changer le mot de passe (utilisateur authentifié)
    path('auth/change-password/', views.PasswordChangeView.as_view(), name='password_change'),
    
    # ====================================================
    # ENDPOINTS PROFIL UTILISATEUR
    # ====================================================
    
    # GET/PUT /api/profile/ - Récupérer/Modifier le profil de l'utilisateur connecté
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    
    # POST/DELETE /api/profile/photo/ - Gérer la photo de profil
    path('profile/photo/', views.UserProfilePhotoView.as_view(), name='user_profile_photo'),

    # GET /api/admin/users/ - Liste des utilisateurs pour le CPanel
    path('admin/users/', views.AdminUsersListView.as_view(), name='admin_users_list'),

    # PATCH /api/admin/users/<id>/role/ - Changer le rôle d'un utilisateur
    path('admin/users/<int:user_id>/role/', views.AdminUserRoleUpdateView.as_view(), name='admin_user_role_update'),

    # GET /api/users/ - Liste publique des utilisateurs inscrits (accessible à tous)
    path('users/', views.PublicUsersListView.as_view(), name='public_users_list'),
    
    # ====================================================
    # ENDPOINTS LAURÉATS
    # ====================================================

    # ====================================================
    # ENDPOINTS LAURÉATS (supplémentaires)
    # ====================================================

    # Statistiques globales
    path('laureats/stats/', views.LaureatStatsView.as_view(), name='laureats_stats'),
    path('laureats/promotions/', views.LaureatPromotionsView.as_view(), name='laureats_promotions'),
    path('laureats/specialites/', views.LaureatSpecialitesView.as_view(), name='laureats_specialites'),
    path('laureats/rejoindre/', views.LaureatJoinRequestView.as_view(), name='laureats_rejoindre'),
    path('laureats/rejoindre/me/', views.LaureatMyJoinRequestsView.as_view(), name='laureats_rejoindre_me'),
    path('laureats/rejoindre/requests/', views.LaureatJoinRequestAdminListView.as_view(), name='laureats_rejoindre_requests'),
    path('laureats/rejoindre/requests/<int:request_id>/', views.LaureatJoinRequestAdminStatusView.as_view(), name='laureats_rejoindre_request_status'),
    path('laureats/me/profile/', views.LaureatMyProfileView.as_view(), name='laureat_my_profile'),
    # Options de filtres
    path('laureats/filters/', views.LaureatFilterOptionsView.as_view(), name='laureats_filters'),

    # Détail basique (carte)
    path('laureats/<int:user_id>/', views.LaureatDetailSimpleView.as_view(), name='laureat_detail_simple'),

    # Fiche publique complète
    path('laureats/<int:user_id>/details/', views.LaureatDetailPublicView.as_view(), name='laureat_detail_public'),

    # Route existante pour la liste des lauréats (générique)
    path('laureats/', views.LaureatListView.as_view(), name='laureats_list'),

    
    # GET /api/laureats/ - Liste des lauréats avec filtres
    path('laureats/', views.LaureatListView.as_view(), name='laureats_list'),
    
    # GET/PUT /api/laureats/<id>/profile/ - Profil d'un lauréat
    path('laureats/<int:user_id>/profile/', views.LaureatProfileDetailView.as_view(), name='laureat_profile'),
    
    # POST /api/laureats/<id>/profile/image/ - Upload photo lauréat
    path('laureats/<int:user_id>/profile/image/', views.LaureatProfileImageView.as_view(), name='laureat_profile_image'),
    
    # PATCH /api/laureats/<id>/mentoring/ - Toggle disponibilité mentorat
    path('laureats/<int:user_id>/mentoring/', views.LaureatMentoringView.as_view(), name='laureat_mentoring'),
    
    # ====================================================
    # HISTORIQUE ACADÉMIQUE ET PROFESSIONNEL (Lauréats)
    # ====================================================
    
    # GET/POST /api/laureats/<id>/historique/ - Liste et création
    path('laureats/<int:user_id>/historique/', views.HistoriqueEntryListCreateView.as_view(), name='laureat_historique_list'),
    
    # GET/PUT/DELETE /api/laureats/<id>/historique/<entry_id>/ - Détail, mise à jour, suppression
    path('laureats/<int:user_id>/historique/<int:entry_id>/', views.HistoriqueEntryDetailView.as_view(), name='laureat_historique_detail'),
    
    # ====================================================
    # COMPÉTENCES (Lauréats)
    # ====================================================
    
    # GET /api/competence-categories/ - Liste des catégories de compétences
    path('competence-categories/', views.CompetenceCategoryListView.as_view(), name='competence_categories'),
    
    # GET/POST /api/laureats/<id>/competences/ - Liste et création
    path('laureats/<int:user_id>/competences/', views.UserCompetenceListCreateView.as_view(), name='laureat_competences_list'),
    
    # PUT/DELETE /api/laureats/<id>/competences/<comp_id>/ - Mise à jour et suppression
    path('laureats/<int:user_id>/competences/<int:comp_id>/', views.UserCompetenceDetailView.as_view(), name='laureat_competence_detail'),
    
    # DELETE /api/laureats/<id>/competences/category/<category_id>/ - Suppression en masse par catégorie
    path('laureats/<int:user_id>/competences/category/<int:category_id>/', views.UserCompetenceBulkDeleteView.as_view(), name='laureat_competence_bulk_delete'),
    
    # ====================================================
    # ENDPOINTS DASHBOARD
    # ====================================================
    
    # GET /api/users/me/stats/ - Statistiques de l'utilisateur
    path('users/me/stats/', views.UserStatsView.as_view(), name='user_stats'),
    
    # GET /api/guides/ - Liste des guides
    path('guides/', views.GuidesView.as_view(), name='guides_list'),
    
    # GET /api/annonces/ - Liste des annonces
    path('annonces/', views.AnnoncesView.as_view(), name='annonces_list'),

    # ====================================================
    # ENDPOINTS NOTIFICATIONS
    # ====================================================

    # GET /api/notifications/ - Liste des notifications de l'utilisateur connecté
    path('notifications/', views.NotificationsListView.as_view(), name='notifications_list'),

    # GET /api/notifications/stats/ - Statistiques des notifications
    path('notifications/stats/', views.NotificationStatsView.as_view(), name='notifications_stats'),

    # PATCH /api/notifications/<id>/read/ - Marquer une notification comme lue
    path('notifications/<int:notification_id>/read/', views.NotificationMarkReadView.as_view(), name='notifications_mark_read'),

    # POST /api/notifications/mark-all-read/ - Marquer toutes les notifications comme lues
    path('notifications/mark-all-read/', views.NotificationsMarkAllReadView.as_view(), name='notifications_mark_all_read'),

    # DELETE /api/notifications/<id>/ - Supprimer une notification
    path('notifications/<int:notification_id>/', views.NotificationDeleteView.as_view(), name='notifications_delete'),
    
    # ====================================================
    # ENDPOINTS VOTE
    # ====================================================
    
    # GET /api/votes/session-active/ - Session de vote active
    path('votes/session-active/', views.ActiveVoteSessionView.as_view(), name='active_vote_session'),

    # POST /api/votes/<session_id>/candidatures/ - Soumettre une candidature
    path('votes/<int:session_id>/candidatures/', views.SubmitCandidatureView.as_view(), name='submit_candidature'),
    
    # POST /api/votes/<session_id>/voter/ - Soumettre un vote
    path('votes/<int:session_id>/voter/', views.SubmitVoteView.as_view(), name='submit_vote'),

    # GET /api/admin/votes/sessions/ - Tableau de bord des sessions de vote pour le CPanel
    path('admin/votes/sessions/', views.AdminVoteSessionsListView.as_view(), name='admin_vote_sessions_list'),

    # GET /api/admin/votes/sessions/<id>/config/ - Configuration détaillée d'une session de vote
    path('admin/votes/sessions/<int:session_id>/config/', views.AdminVoteSessionConfigView.as_view(), name='admin_vote_session_config'),

    # POST /api/admin/votes/sessions/<id>/positions/ - Ajouter un poste à une session de vote
    path('admin/votes/sessions/<int:session_id>/positions/', views.AdminVotePositionCreateView.as_view(), name='admin_vote_position_create'),

    # DELETE /api/admin/votes/positions/<id>/ - Supprimer un poste de vote
    path('admin/votes/positions/<int:position_id>/', views.AdminVotePositionDeleteView.as_view(), name='admin_vote_position_delete'),

    # POST /api/admin/votes/positions/<id>/candidates/ - Affecter un candidat à un poste
    path('admin/votes/positions/<int:position_id>/candidates/', views.AdminVoteCandidateCreateView.as_view(), name='admin_vote_candidate_create'),

    # PATCH /api/admin/votes/candidates/<id>/approval/ - Approuver ou retirer un candidat
    path('admin/votes/candidates/<int:candidate_id>/approval/', views.AdminVoteCandidateApprovalView.as_view(), name='admin_vote_candidate_approval'),

    # DELETE /api/admin/votes/candidates/<id>/ - Supprimer un candidat
    path('admin/votes/candidates/<int:candidate_id>/', views.AdminVoteCandidateDeleteView.as_view(), name='admin_vote_candidate_delete'),

    # POST /api/votes/<session_id>/open-candidacy/ - Ouvrir phase candidature (admin)
    path('votes/<int:session_id>/open-candidacy/', views.OpenCandidacyPhaseView.as_view(), name='open_candidacy_phase'),

    # POST /api/votes/<session_id>/start-voting/ - Demarrer phase vote (admin)
    path('votes/<int:session_id>/start-voting/', views.StartVotingPhaseView.as_view(), name='start_voting_phase'),

    # POST /api/votes/<session_id>/close/ - Cloturer session vote (admin)
    path('votes/<int:session_id>/close/', views.CloseVoteSessionView.as_view(), name='close_vote_session'),

    # POST /api/votes/<session_id>/renew-bureau/ - Renouveler membres du bureau (admin)
    path('votes/<int:session_id>/renew-bureau/', views.RenewBureauMembersView.as_view(), name='renew_bureau_members'),
    
    # Routes du routeur
    path("", include(routeur.urls)),
    path('home/', views.HomePageView.as_view(), name='home-page-data'),
    # À propos
    path('about/stats/', views.AboutStatsView.as_view(), name='about-stats'),
    path('about/leaders/', views.AboutLeadersView.as_view(), name='about-leaders'),
    path('about/content/', views.AboutContentView.as_view(), name='about-content'),

# École
    path('school/clubs/', views.SchoolClubsView.as_view(), name='school-clubs'),
    path('school/academic-calendar/', views.AcademicCalendarView.as_view(), name='academic-calendar'),
    path('school/practical-info/', views.PracticalInfoView.as_view(), name='practical-info'),
    path('school/media/', views.SchoolMediaView.as_view(), name='school-media'),
    path('school/student-guide/', views.StudentGuideView.as_view(), name='student-guide'),                        
    path('activities/propose/', views.ProposeActivityView.as_view(), name='propose_activity'),
    path('activities/categories/', views.ActivityCategoriesView.as_view(), name='activity_categories'),
    path('auth/register-page/', views.RegisterPageView.as_view(), name='register_page'),
    path('auth/specializations/', views.SpecializationsView.as_view(), name='specializations'),
    path('auth/academic-years/', views.AcademicYearsView.as_view(), name='academic_years'),
    path('activities/propose/<int:pk>/review/', views.ReviewActivityProposalView.as_view(), name='review_proposal'),
    path('activities/propose/pending/', views.PendingProposalsView.as_view(), name='pending_proposals'),
    path('activities/events/upcoming/', views.UpcomingEventsView.as_view(), name='upcoming-events'),
    # Classroom: classes, subjects, resources
    path('classroom/', views.ClassroomListCreateView.as_view(), name='classroom_list'),
    path('classroom/<int:classroom_id>/', views.ClassroomDetailView.as_view(), name='classroom_detail'),
    path('classroom/<int:classroom_id>/subjects/', views.SubjectListCreateView.as_view(), name='subject_list'),
    path('classroom/<int:classroom_id>/subjects/<int:subject_id>/', views.SubjectDetailView.as_view(), name='subject_detail'),
    path('classroom/<int:classroom_id>/subjects/<int:subject_id>/resources/', views.ResourceListCreateView.as_view(), name='resource_list'),
    path('classroom/<int:classroom_id>/subjects/<int:subject_id>/resources/<int:resource_id>/', views.ResourceDetailView.as_view(), name='resource_detail'),
]

