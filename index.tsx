

import { createClient } from '@supabase/supabase-js';
import jsQR from 'jsqr';
import { generateReportPDF } from './pdf-generator';
import QRCode from 'qrcode';
import SignaturePad from 'signature_pad';
import { calculateSchedule } from './schedule-calculator';
import type { User, City, Company, Dependency, Equipment, Report, ScheduledMaintenanceItem, PaginationState, MaintenanceTableKey, Database } from './types';


// --- Supabase Configuration ---
const SUPABASE_URL: string = 'https://fzcalgofrhbqvowazdpk.supabase.co'; 
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y2FsZ29mcmhicXZvd2F6ZHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjQwNTQsImV4cCI6MjA2NzA0MDA1NH0.yavOv5g0iQElk7X8GHOAQrO9rnvb2mDb-i2PgtGCX-o';

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("Cliente de Supabase inicializado correctamente.");


// Supabase Table Names
const TABLE_USERS = 'maintenance_users';
const TABLE_EQUIPMENT = 'maintenance_equipment';
const TABLE_REPORTS = 'maintenance_reports';
const TABLE_CITIES = 'maintenance_cities';
const TABLE_COMPANIES = 'maintenance_companies';
const TABLE_DEPENDENCIES = 'maintenance_dependencies';
const TABLE_SCHEDULE = 'maintenance_schedule';


// --- DOM Elements ---
const loginScreen = document.getElementById('login-screen') as HTMLDivElement;
const appScreen = document.getElementById('app-screen') as HTMLDivElement;
const loginForm = document.getElementById('login-form') as HTMLFormElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const loginError = document.getElementById('login-error') as HTMLParagraphElement;
const logoutButton = document.getElementById('logout-button') as HTMLButtonElement;
const currentUserDisplay = document.getElementById('current-user-display') as HTMLSpanElement;

const adminPinLoginButton = document.getElementById('admin-pin-login-button') as HTMLButtonElement;


const appHeaderTitle = document.querySelector('#app-screen header h1') as HTMLElement;
const bottomNav = document.getElementById('bottom-nav') as HTMLElement;
const allSections = document.querySelectorAll('#app-screen main .data-section') as NodeListOf<HTMLElement>;

// Worker Section Elements
const scanQrCameraButton = document.getElementById('scan-qr-camera-button') as HTMLButtonElement;
const scanQrFromFileButton = document.getElementById('scan-qr-file-button') as HTMLButtonElement;
const qrFileInput = document.getElementById('qr-file-input') as HTMLInputElement;
const createManualReportButton = document.getElementById('create-manual-report-button') as HTMLButtonElement;

// My Reports Table
const myReportsTableBody = document.getElementById('my-reports-table')?.getElementsByTagName('tbody')[0];
const myReportsSearchInput = document.getElementById('my-reports-search') as HTMLInputElement;
const myReportsSearchClearButton = document.getElementById('my-reports-search-clear') as HTMLButtonElement;
const myReportsPaginationContainer = document.getElementById('my-reports-pagination');

// Admin Section Elements
const deleteAllReportsButton = document.getElementById('delete-all-reports-button') as HTMLButtonElement;
const adminReportsTableBody = document.getElementById('admin-reports-table')?.getElementsByTagName('tbody')[0];
const adminReportsSearchInput = document.getElementById('admin-reports-search') as HTMLInputElement;
const adminReportsSearchClearButton = document.getElementById('admin-reports-search-clear') as HTMLButtonElement;
const adminReportsPaginationContainer = document.getElementById('admin-reports-pagination');
const filterReportDateStart = document.getElementById('filter-report-date-start') as HTMLInputElement;
const filterReportDateEnd = document.getElementById('filter-report-date-end') as HTMLInputElement;
const filterReportCity = document.getElementById('filter-report-city') as HTMLSelectElement;
const filterReportCompany = document.getElementById('filter-report-company') as HTMLSelectElement;
const filterReportServiceType = document.getElementById('filter-report-service-type') as HTMLSelectElement;
const filterReportTechnician = document.getElementById('filter-report-technician') as HTMLSelectElement;

const adminScheduleTableBody = document.getElementById('admin-schedule-table')?.getElementsByTagName('tbody')[0];
const adminSchedulePaginationContainer = document.getElementById('admin-schedule-pagination');

const addEquipmentButton = document.getElementById('add-equipment-button') as HTMLButtonElement;
const adminEquipmentTableBody = document.getElementById('admin-equipment-table')?.getElementsByTagName('tbody')[0];
const adminEquipmentSearchInput = document.getElementById('admin-equipment-search') as HTMLInputElement;
const adminEquipmentSearchClearButton = document.getElementById('admin-equipment-search-clear') as HTMLButtonElement;
const adminEquipmentPaginationContainer = document.getElementById('admin-equipment-pagination');

// Admin Management Tab Controls
const adminManagementSection = document.getElementById('admin-management-section') as HTMLElement;
const tabLinks = adminManagementSection.querySelectorAll('.tabs .tab-link');
const tabContents = adminManagementSection.querySelectorAll('.tab-content');

const addCityButton = document.getElementById('add-city-button') as HTMLButtonElement;
const citiesTableBody = document.getElementById('cities-table')?.getElementsByTagName('tbody')[0];
const addCompanyButton = document.getElementById('add-company-button') as HTMLButtonElement;
const companiesTableBody = document.getElementById('companies-table')?.getElementsByTagName('tbody')[0];
const addDependencyButton = document.getElementById('add-dependency-button') as HTMLButtonElement;
const dependenciesTableBody = document.getElementById('dependencies-table')?.getElementsByTagName('tbody')[0];
const addEmployeeButton = document.getElementById('add-employee-button') as HTMLButtonElement;
const employeesTableBody = document.getElementById('employees-table')?.getElementsByTagName('tbody')[0];


// Report Form Modal Elements
const reportFormModal = document.getElementById('report-form-modal') as HTMLDivElement;
const closeReportFormModalButton = document.getElementById('close-report-form-modal') as HTMLSpanElement;
const maintenanceReportForm = document.getElementById('maintenance-report-form') as HTMLFormElement;
const reportIdInput = document.getElementById('report-id') as HTMLInputElement; // For editing
const reportEquipmentIdHidden = document.getElementById('report-equipment-id-hidden') as HTMLInputElement;
const reportServiceTypeSelect = document.getElementById('report-service-type') as HTMLSelectElement;
const reportCitySelect = document.getElementById('report-city') as HTMLSelectElement;
const reportCompanySelect = document.getElementById('report-company') as HTMLSelectElement;
const reportDependencySelect = document.getElementById('report-dependency') as HTMLSelectElement;
const reportEquipmentModelInput = document.getElementById('report-equipment-model') as HTMLInputElement;
const reportEquipmentBrandInput = document.getElementById('report-equipment-brand') as HTMLInputElement;
const reportEquipmentTypeSelect = document.getElementById('report-equipment-type') as HTMLSelectElement;
const reportEquipmentCapacityInput = document.getElementById('report-equipment-capacity') as HTMLInputElement;
const reportEquipmentRefrigerantSelect = document.getElementById('report-equipment-refrigerant') as HTMLSelectElement;
const reportObservationsTextarea = document.getElementById('report-observations') as HTMLTextAreaElement;
const openSignatureModalButton = document.getElementById('open-signature-modal-button') as HTMLButtonElement;
const signaturePreviewContainer = document.getElementById('signature-preview-container') as HTMLDivElement;
const signaturePreviewImage = document.getElementById('signature-preview-image') as HTMLImageElement;
const signaturePlaceholderText = document.getElementById('signature-placeholder-text') as HTMLSpanElement;
const reportWorkerNameInput = document.getElementById('report-worker-name') as HTMLInputElement;
const saveReportButton = document.getElementById('save-report-button') as HTMLButtonElement;
const cancelReportButton = document.getElementById('cancel-report-button') as HTMLButtonElement;
const manualEquipmentSelectorContainer = document.getElementById('manual-equipment-selector-container');
const equipmentSelector = document.getElementById('report-equipment-selector') as HTMLSelectElement;



// Signature Modal Elements
const signatureModal = document.getElementById('signature-modal') as HTMLDivElement;
const closeSignatureModalButton = document.getElementById('close-signature-modal') as HTMLSpanElement;
const signatureCanvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
const saveSignatureButton = document.getElementById('save-signature-button') as HTMLButtonElement;
const clearSignatureButton = document.getElementById('clear-signature-button') as HTMLButtonElement;
let signaturePad: SignaturePad | null = null; 

// Camera Scan Modal Elements
const cameraScanModal = document.getElementById('camera-scan-modal') as HTMLDivElement;
const closeCameraScanModalButton = document.getElementById('close-camera-scan-modal') as HTMLSpanElement;
const qrVideoElement = document.getElementById('qr-video') as HTMLVideoElement;
const qrHiddenCanvasElement = document.getElementById('qr-canvas-hidden') as HTMLCanvasElement;
const cancelCameraScanButton = document.getElementById('cancel-camera-scan-button') as HTMLButtonElement;
const cameraScanFeedback = document.getElementById('camera-scan-feedback') as HTMLParagraphElement;

// Entity Form Modal Elements
const entityFormModal = document.getElementById('entity-form-modal') as HTMLDivElement;
const closeEntityFormModalButton = document.getElementById('close-entity-form-modal') as HTMLSpanElement;
const entityFormTitle = document.getElementById('entity-form-title') as HTMLHeadingElement;
const entityForm = document.getElementById('entity-form') as HTMLFormElement;
const entityIdInput = document.getElementById('entity-id') as HTMLInputElement;
const entityTypeInput = document.getElementById('entity-type') as HTMLInputElement;
const entityFormFieldsContainer = document.getElementById('entity-form-fields-container') as HTMLDivElement;
const saveEntityButton = document.getElementById('save-entity-button') as HTMLButtonElement;
const cancelEntityButton = document.getElementById('cancel-entity-button') as HTMLButtonElement;

// View Report Details Modal
const viewReportDetailsModal = document.getElementById('view-report-details-modal') as HTMLDivElement;
const closeViewReportDetailsModalButton = document.getElementById('close-view-report-details-modal') as HTMLSpanElement;
const viewReportIdDisplay = document.getElementById('view-report-id-display') as HTMLSpanElement;
const viewReportDetailsContent = document.getElementById('view-report-details-content') as HTMLDivElement;
const downloadReportPdfButton = document.getElementById('download-report-pdf-button') as HTMLButtonElement;
const closeViewReportButton = document.getElementById('close-view-report-button') as HTMLButtonElement;

// Admin Login Modal (formerly PIN)
const adminPinModal = document.getElementById('admin-pin-modal') as HTMLDivElement;
const closeAdminPinModalButton = document.getElementById('close-admin-pin-modal') as HTMLSpanElement;
const adminPinForm = document.getElementById('admin-pin-form') as HTMLFormElement;
const adminPinInput = document.getElementById('admin-pin-input') as HTMLInputElement; // Note: Now used for password
const adminPinError = document.getElementById('admin-pin-error') as HTMLParagraphElement;

// Change Password Button in Header (formerly PIN)
const changePinActionButton = document.getElementById('change-pin-action-button') as HTMLButtonElement;

// Change Password Modal (formerly PIN)
const changePinModal = document.getElementById('change-pin-modal') as HTMLDivElement;
const closeChangePinModalButton = document.getElementById('close-change-pin-modal') as HTMLSpanElement;
const changePinForm = document.getElementById('change-pin-form') as HTMLFormElement;
const currentPinInput = document.getElementById('current-pin-input') as HTMLInputElement; // Note: Now used for current password
const newPinInput = document.getElementById('new-pin-input') as HTMLInputElement; // Note: Now used for new password
const confirmNewPinInput = document.getElementById('confirm-new-pin-input') as HTMLInputElement; // Note: Now used for confirm password
const savePinButton = document.getElementById('save-pin-button') as HTMLButtonElement;
const cancelChangePinButton = document.getElementById('cancel-change-pin-button') as HTMLButtonElement;
const changePinError = document.getElementById('change-pin-error') as HTMLParagraphElement;


// Shared Modals (Reused from previous app structure)
const confirmationModal = document.getElementById('confirmation-modal') as HTMLDivElement;
const confirmationMessage = document.getElementById('confirmation-message') as HTMLParagraphElement;
const confirmActionButton = document.getElementById('confirm-action-button') as HTMLButtonElement;
const cancelActionButton = document.getElementById('cancel-action-button') as HTMLButtonElement;
const closeConfirmationModalButton = document.getElementById('close-confirmation-modal-button') as HTMLSpanElement;

const imagePreviewModal = document.getElementById('image-preview-modal') as HTMLDivElement;
const imagePreviewContent = document.getElementById('image-preview-content') as HTMLImageElement;
const closeImagePreviewModalButton = document.getElementById('close-image-preview-modal') as HTMLSpanElement;

const notificationArea = document.getElementById('app-notification-area');
const toggleFullscreenButton = document.getElementById('toggle-fullscreen-button') as HTMLButtonElement;
const loadingOverlay = document.getElementById('loading-overlay') as HTMLDivElement;


const tablePaginationStates: Record<MaintenanceTableKey, PaginationState> = {
    myReports: { currentPage: 1, itemsPerPage: 10 },
    adminReports: { currentPage: 1, itemsPerPage: 10 },
    adminSchedule: { currentPage: 1, itemsPerPage: 10 },
    adminEquipment: { currentPage: 1, itemsPerPage: 10 },
    adminCities: { currentPage: 1, itemsPerPage: 10 },
    adminCompanies: { currentPage: 1, itemsPerPage: 10 },
    adminDependencies: { currentPage: 1, itemsPerPage: 10 },
    adminEmployees: { currentPage: 1, itemsPerPage: 10 },
};

const tableSearchTerms: Record<MaintenanceTableKey, string> = {
    myReports: '',
    adminReports: '',
    adminSchedule: '', 
    adminEquipment: '',
    adminCities: '', 
    adminCompanies: '',
    adminDependencies: '',
    adminEmployees: '',
};

type EntityType = 'city'|'company'|'dependency'|'equipment'|'employee' | 'equipmentType' | 'refrigerant';

// --- App State ---
let currentUser: User | null = null;
let users: User[] = [];
let equipmentList: Equipment[] = [];
let cities: City[] = [];
let companies: Company[] = [];
let dependencies: Dependency[] = [];
let reports: Report[] = [];
let equipmentTypes: string[] = [];
let refrigerantTypes: string[] = [];

let currentReportSignatureDataUrl: string | null = null; // For the report being created/edited
let isSignaturePadDirty = false;

// QR Camera Scan State
let currentCameraStream: MediaStream | null = null;
let qrScanFrameId: number | null = null;

// Context for the quick-add feature
let entityFormContext: {
    source: 'reportForm';
    entityType: EntityType;
    newIdToSelect?: string;
} | null = null;


// --- localStorage Keys ---
const EQUIPMENT_TYPES_KEY = 'maintenance_equipment_types';
const REFRIGERANT_TYPES_KEY = 'maintenance_refrigerant_types';
const DATA_VERSION_KEY = 'maintenance_data_version';
const CURRENT_DATA_VERSION = '1.6_full_impl'; 


// --- Utility Functions ---
function generateId(): string {
    return crypto.randomUUID();
}

function formatDate(dateInput?: Date | string, includeTime: boolean = true): string {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: '2-digit', day: '2-digit'
    };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    try {
      return date.toLocaleString('es-ES', options);
    } catch (e) {
      const d = new Date(dateInput); 
      if (isNaN(d.getTime())) return 'Fecha Inválida';
      return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit'});
    }
}

function showAppNotification(message: string, type: 'error' | 'success' | 'info' | 'warning' = 'info', duration: number = 3000) {
    if (!notificationArea) {
        console.error("Notification area not found in DOM. Fallback to alert.");
        alert(message);
        return;
    }

    const notificationDiv = document.createElement('div');
    notificationDiv.classList.add('app-notification', type);

    const iconElement = document.createElement('i');
    iconElement.classList.add('fas');
    if (type === 'error') iconElement.classList.add('fa-times-circle');
    else if (type === 'success') iconElement.classList.add('fa-check-circle');
    else if (type === 'warning') iconElement.classList.add('fa-exclamation-triangle');
    else iconElement.classList.add('fa-info-circle');

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    notificationDiv.appendChild(iconElement);
    notificationDiv.appendChild(messageSpan);
    notificationArea.appendChild(notificationDiv);
    
    void notificationDiv.offsetHeight; 

    setTimeout(() => {
        notificationDiv.classList.add('removing');
        notificationDiv.addEventListener('animationend', () => {
            if (notificationDiv.parentElement) {
                 notificationDiv.remove();
            }
        });
    }, duration);
}

function showLoader(message: string = 'Cargando...') {
    if (loadingOverlay) {
        const messageElement = loadingOverlay.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoader() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

let activeConfirmationResolve: ((value: boolean) => void) | null = null;

function showConfirmationModal(
    message: string,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
): Promise<boolean> {
    return new Promise((resolve) => {
        if (!confirmationModal || !confirmationMessage || !confirmActionButton || !cancelActionButton || !closeConfirmationModalButton) {
            console.error("Confirmation modal elements not found. Falling back to native confirm.");
            resolve(confirm(message));
            return;
        }
        activeConfirmationResolve = resolve;
        confirmationMessage.textContent = message;
        confirmActionButton.innerHTML = `<i class="fas fa-check"></i> ${confirmText}`;
        cancelActionButton.innerHTML = `<i class="fas fa-times"></i> ${cancelText}`;

        confirmActionButton.className = 'btn'; 
        if (confirmText.toLowerCase().includes("eliminar") || confirmText.toLowerCase().includes("borrar") || confirmText.toLowerCase().includes("todo")) {
            confirmActionButton.classList.add('btn-danger');
        } else {
            confirmActionButton.classList.add('btn-primary');
        }
        cancelActionButton.className = 'btn btn-secondary';

        confirmationModal.style.display = 'flex';

        confirmActionButton.onclick = () => {
            confirmationModal.style.display = 'none';
            if (activeConfirmationResolve) activeConfirmationResolve(true);
            activeConfirmationResolve = null;
        };
        cancelActionButton.onclick = () => {
            confirmationModal.style.display = 'none';
            if (activeConfirmationResolve) activeConfirmationResolve(false);
            activeConfirmationResolve = null;
        };
        closeConfirmationModalButton.onclick = () => {
            confirmationModal.style.display = 'none';
            if (activeConfirmationResolve) activeConfirmationResolve(false);
            activeConfirmationResolve = null;
        };
    });
}

function showImagePreviewModal(imageUrl: string | null | undefined) {
    if (!imageUrl) {
        console.warn("No image URL provided to showImagePreviewModal.");
        return;
    }
    if (!imagePreviewModal || !imagePreviewContent || !closeImagePreviewModalButton) {
        console.error("Image preview modal elements not found. Fallback to new tab.");
        const newTab = window.open();
        newTab?.document.write(`<img src="${imageUrl}" style="max-width:90vw; max-height:90vh; object-fit:contain;">`);
        return;
    }
    imagePreviewContent.src = imageUrl;
    imagePreviewModal.style.display = 'flex';
}

function resizeCanvas(canvas: HTMLCanvasElement) {
    // When zoomed out to less than 100%, for some very strange reason,
    // some browsers report devicePixelRatio as less than 1
    // and only part of the canvas is cleared then.
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
    }
}


// --- Data Loading and Saving (Supabase + localStorage for non-DB data) ---

async function fetchCities() {
    const { data, error } = await supabase.from(TABLE_CITIES).select('*').order('name');
    if (error) {
        console.error('Error fetching cities:', error);
        showAppNotification('Error al cargar ciudades desde la base de datos.', 'error');
        return;
    }
    cities = data as City[];
}

async function fetchCompanies() {
    const { data, error } = await supabase.from(TABLE_COMPANIES).select('*').order('name');
    if (error) {
        console.error('Error fetching companies:', error);
        showAppNotification('Error al cargar empresas desde la base de datos.', 'error');
        return;
    }
    companies = data.map((dbCompany: any) => ({
        id: dbCompany.id,
        name: dbCompany.name,
        cityId: dbCompany.city_id,
    })) as Company[];
}

async function fetchDependencies() {
    const { data, error } = await supabase.from(TABLE_DEPENDENCIES).select('*').order('name');
    if (error) {
        console.error('Error fetching dependencies:', error);
        showAppNotification('Error al cargar dependencias desde la base de datos.', 'error');
        return;
    }
    dependencies = data.map((dbDependency: any) => ({
        id: dbDependency.id,
        name: dbDependency.name,
        companyId: dbDependency.company_id,
    })) as Dependency[];
}

async function fetchEquipment() {
    const { data, error } = await supabase.from(TABLE_EQUIPMENT).select('*').order('brand').order('model');
    if (error) {
        console.error('Error fetching equipment:', error);
        showAppNotification('Error al cargar equipos desde la base de datos.', 'error');
        return;
    }
    equipmentList = data.map((dbEquipment: any) => ({
        id: dbEquipment.id,
        created_at: dbEquipment.created_at,
        model: dbEquipment.model,
        brand: dbEquipment.brand,
        type: dbEquipment.type,
        capacity: dbEquipment.capacity,
        refrigerant: dbEquipment.refrigerant,
        periodicityMonths: dbEquipment.periodicity_months,
        lastMaintenanceDate: dbEquipment.last_maintenance_date,
        cityId: dbEquipment.city_id,
        companyId: dbEquipment.company_id,
        dependencyId: dbEquipment.dependency_id,
    })) as Equipment[];
}

async function fetchReports() {
    const { data, error } = await supabase.from(TABLE_REPORTS).select('*');
    if (error) {
        console.error('Error fetching reports:', error);
        showAppNotification('Error al cargar reportes desde la base de datos.', 'error');
        return;
    }
    reports = data.map((dbReport: any) => ({
        id: dbReport.id,
        timestamp: dbReport.timestamp,
        serviceType: dbReport.service_type,
        observations: dbReport.observations,
        equipmentSnapshot: dbReport.equipment_snapshot,
        cityId: dbReport.city_id,
        companyId: dbReport.company_id,
        dependencyId: dbReport.dependency_id,
        workerId: dbReport.worker_id,
        workerName: dbReport.worker_name,
        clientSignature: dbReport.client_signature,
    })) as Report[];
}

async function fetchUsers() {
    const { data, error } = await supabase.from(TABLE_USERS).select('*');
    if (error) {
        console.error('Error fetching users:', error);
        showAppNotification('Error al cargar usuarios desde la base de datos.', 'error');
        return;
    }
    users = data.map((dbUser: any) => ({
        id: dbUser.id,
        username: dbUser.username,
        password: dbUser.password,
        role: dbUser.role,
        name: dbUser.name,
        cedula: dbUser.cedula,
        isActive: dbUser.is_active,
    })) as User[];
}


async function loadInitialData() {
    showLoader('Cargando datos...');
    // Fetch all data from Supabase
    await Promise.all([
        fetchCities(), 
        fetchCompanies(), 
        fetchDependencies(),
        fetchReports(),
        fetchUsers(),
        fetchEquipment()
    ]);
    console.log("Data loaded from Supabase:", { cities, companies, dependencies, reports, users, equipmentList });
    
    // --- User Seeding: Create default users if they don't exist in the DB ---
    let usersNeedRefetch = false;

    const adminUserExists = users.some(u => u.username === 'admin');
    if (!adminUserExists) {
        console.log("Seeding Admin user...");
        const { error } = await supabase.from(TABLE_USERS).insert([{
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'Administrador Principal',
            cedula: 'admin001',
            is_active: true,
        }]);
        if(error) console.error("Error seeding admin:", error);
        else usersNeedRefetch = true;
    }
    
    const devWorkerExists = users.some(u => u.cedula === '12345678');
    if (!devWorkerExists) {
        console.log("Seeding Dev Worker user...");
        const { error } = await supabase.from(TABLE_USERS).insert([{
            username: '12345678',
            password: '12345678',
            role: 'worker',
            name: 'Luis Cabrera (Dev)',
            cedula: '12345678',
            is_active: true
        }]);
        if(error) console.error("Error seeding dev worker:", error);
        else usersNeedRefetch = true;
    }

    const mariaWorkerExists = users.some(u => u.cedula === '87654321');
    if (!mariaWorkerExists) {
        console.log("Seeding Maria Lopez user...");
        const { error } = await supabase.from(TABLE_USERS).insert([{
            username: '87654321',
            password: '87654321',
            role: 'worker',
            name: 'Maria Lopez (Técnica)',
            cedula: '87654321',
            is_active: true
        }]);
        if(error) console.error("Error seeding Maria Lopez:", error);
        else usersNeedRefetch = true;
    }
    
    if (usersNeedRefetch) {
        console.log("Refetching users after seeding...");
        await fetchUsers();
    }
    
    // Load data from localStorage
    const storedEquipmentTypes = localStorage.getItem(EQUIPMENT_TYPES_KEY);
    equipmentTypes = storedEquipmentTypes ? JSON.parse(storedEquipmentTypes) : ['Mini split', 'Cassette', 'Central', 'Piso techo', 'Otro'];

    const storedRefrigerantTypes = localStorage.getItem(REFRIGERANT_TYPES_KEY);
    refrigerantTypes = storedRefrigerantTypes ? JSON.parse(storedRefrigerantTypes) : ['R410A', 'R22', 'R32', 'R134a', 'R407C', 'Otro'];

    console.log("Data loaded/updated from localStorage:", { equipmentTypes, refrigerantTypes });
}

function saveLocalDataToLocalStorage() {
    localStorage.setItem(EQUIPMENT_TYPES_KEY, JSON.stringify(equipmentTypes));
    localStorage.setItem(REFRIGERANT_TYPES_KEY, JSON.stringify(refrigerantTypes));
}


// --- UI Rendering and Population ---

function populateBottomNav(role: 'admin' | 'worker') {
    if (!bottomNav) return;
    bottomNav.innerHTML = ''; 

    let navItemsConfig: { id: string; title: string; icon: string; sectionId: string }[] = [];

    if (role === 'admin') {
        navItemsConfig = [
            { id: 'nav-admin-reports', title: 'Reportes', icon: 'fa-file-invoice', sectionId: 'admin-reports-section' },
            { id: 'nav-admin-schedule', title: 'Cronograma', icon: 'fa-calendar-alt', sectionId: 'admin-schedule-section' },
            { id: 'nav-admin-equipment', title: 'Equipos', icon: 'fa-cogs', sectionId: 'admin-equipment-section' },
            { id: 'nav-admin-management', title: 'Gestión', icon: 'fa-sitemap', sectionId: 'admin-management-section' },
        ];
    } else if (role === 'worker') {
        navItemsConfig = [
            { id: 'nav-worker-main', title: 'Nuevo Reporte', icon: 'fa-edit', sectionId: 'worker-main-section' },
            { id: 'nav-worker-my-reports', title: 'Mis Reportes', icon: 'fa-history', sectionId: 'worker-my-reports-section' },
        ];
    }

    navItemsConfig.forEach(item => {
        const button = document.createElement('button');
        button.classList.add('nav-item');
        button.dataset.sectionId = item.sectionId;
        button.dataset.sectionTitle = item.title;
        button.dataset.iconClass = `fas ${item.icon}`;
        button.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.title}</span>`;
        button.addEventListener('click', () => showView(item.sectionId, item.title, `fas ${item.icon}`));
        bottomNav.appendChild(button);
    });
}

function showView(sectionId: string, sectionTitle: string, iconClass: string) {
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
        if (sectionId === 'admin-reports-section') renderAdminReportsTable();
        else if (sectionId === 'admin-schedule-section') renderAdminScheduleTable();
        else if (sectionId === 'admin-equipment-section') renderAdminEquipmentTable();
        else if (sectionId === 'admin-management-section') {
            const firstTabLink = tabLinks[0] as HTMLButtonElement | undefined;
            if (firstTabLink) {
                handleTabClick(new MouseEvent('click', {bubbles: true}), firstTabLink); 
            } else { 
                renderCitiesTable();
                renderCompaniesTable();
                renderDependenciesTable();
                renderEmployeesTable();
            }
        } else if (sectionId === 'worker-my-reports-section') {
            renderMyReportsTable();
        }
    } else {
        console.warn(`Section with ID '${sectionId}' not found.`);
    }

    if (appHeaderTitle) {
        appHeaderTitle.innerHTML = `<i class="${iconClass}"></i> ${sectionTitle}`;
    }

    const currentNavItems = bottomNav.querySelectorAll('.nav-item');
    currentNavItems.forEach(item => {
        const buttonItem = item as HTMLButtonElement;
        if (buttonItem.dataset.sectionId === sectionId) {
            buttonItem.classList.add('active');
        } else {
            buttonItem.classList.remove('active');
        }
    });
    window.scrollTo(0, 0);
}


function renderMyReportsTable() { 
    if (!myReportsTableBody || !currentUser || currentUser.role !== 'worker') return;
    myReportsTableBody.innerHTML = ''; 

    const searchTerm = tableSearchTerms.myReports.toLowerCase();
    let userReports = reports.filter(report => report.workerId === currentUser!.id);
    
    if (searchTerm) {
        userReports = userReports.filter(report =>
            report.id.toLowerCase().includes(searchTerm) ||
            report.serviceType.toLowerCase().includes(searchTerm) ||
            (report.equipmentSnapshot.brand || '').toLowerCase().includes(searchTerm) ||
            (report.equipmentSnapshot.model || '').toLowerCase().includes(searchTerm) ||
            (companies.find(c => c.id === report.companyId)?.name || '').toLowerCase().includes(searchTerm)
        );
    }

    if (userReports.length === 0) {
        myReportsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Aún no has enviado ningún reporte.</td></tr>';
        renderPaginationControls('myReports', 0, myReportsPaginationContainer, renderMyReportsTable);
        return;
    }

    userReports.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 

    const pagination = tablePaginationStates.myReports;
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const paginatedReports = userReports.slice(startIndex, endIndex);

    if (paginatedReports.length === 0 && pagination.currentPage > 1) { 
        pagination.currentPage = 1;
        renderMyReportsTable(); 
        return;
    }

    paginatedReports.forEach(report => {
        const tr = document.createElement('tr');
        const company = companies.find(c => c.id === report.companyId);

        tr.innerHTML = `
            <td data-label="Fecha">${formatDate(report.timestamp)}</td>
            <td data-label="ID Reporte">${report.id.substring(0,8)}...</td>
            <td data-label="Tipo Servicio">${report.serviceType === 'preventivo' ? 'Preventivo' : 'Correctivo'}</td>
            <td data-label="Equipo">${report.equipmentSnapshot.brand} ${report.equipmentSnapshot.model}</td>
            <td data-label="Empresa">${company?.name || 'N/A'}</td>
            <td data-label="Acciones">
                <button class="btn btn-secondary action-btn view-report-btn" data-report-id="${report.id}"><i class="fas fa-eye"></i> Ver</button>
            </td>
        `;
        myReportsTableBody.appendChild(tr);
    });
    myReportsTableBody.querySelectorAll('.view-report-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reportId = (e.currentTarget as HTMLButtonElement).dataset.reportId;
            const reportItem = reports.find(r => r.id === reportId); 
            if (reportItem) openViewReportDetailsModal(reportItem);
        });
    });
    renderPaginationControls('myReports', userReports.length, myReportsPaginationContainer, renderMyReportsTable);
}

function renderAdminReportsTable() { 
     if (!adminReportsTableBody) return;
    adminReportsTableBody.innerHTML = '';
    
    // Filtering logic
    const searchTerm = tableSearchTerms.adminReports.toLowerCase();
    const dateStart = filterReportDateStart.value ? new Date(filterReportDateStart.value) : null;
    if(dateStart) dateStart.setHours(0,0,0,0);
    const dateEnd = filterReportDateEnd.value ? new Date(filterReportDateEnd.value) : null;
    if(dateEnd) dateEnd.setHours(23,59,59,999);
    const cityId = filterReportCity.value;
    const companyId = filterReportCompany.value;
    const serviceType = filterReportServiceType.value;
    const technicianId = filterReportTechnician.value;

    let filteredReports = [...reports].filter(r => {
        if(dateStart && new Date(r.timestamp) < dateStart) return false;
        if(dateEnd && new Date(r.timestamp) > dateEnd) return false;
        if(cityId && r.cityId !== cityId) return false;
        if(companyId && r.companyId !== companyId) return false;
        if(serviceType && r.serviceType !== serviceType) return false;
        if(technicianId && r.workerId !== technicianId) return false;
        if (searchTerm && !(
            r.id.toLowerCase().includes(searchTerm) ||
            r.workerName.toLowerCase().includes(searchTerm) ||
            (r.equipmentSnapshot.brand || '').toLowerCase().includes(searchTerm) ||
            (r.equipmentSnapshot.model || '').toLowerCase().includes(searchTerm) ||
            (companies.find(c => c.id === r.companyId)?.name || '').toLowerCase().includes(searchTerm) ||
            (cities.find(c => c.id === r.cityId)?.name || '').toLowerCase().includes(searchTerm)
        )) return false;
        return true;
    });

    if (filteredReports.length === 0) {
        adminReportsTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay reportes que coincidan con los filtros.</td></tr>';
        renderPaginationControls('adminReports', 0, adminReportsPaginationContainer, renderAdminReportsTable);
        return;
    }
    
    filteredReports.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const pagination = tablePaginationStates.adminReports;
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    if (paginatedReports.length === 0 && pagination.currentPage > 1) {
        pagination.currentPage = 1;
        renderAdminReportsTable();
        return;
    }

    paginatedReports.forEach(report => {
        const tr = document.createElement('tr');
        const city = cities.find(c => c.id === report.cityId);
        const company = companies.find(c => c.id === report.companyId);

        tr.innerHTML = `
            <td data-label="Fecha">${formatDate(report.timestamp)}</td>
            <td data-label="ID Reporte">${report.id.substring(0,8)}...</td>
            <td data-label="Técnico">${report.workerName}</td>
            <td data-label="Tipo">${report.serviceType === 'preventivo' ? 'Preventivo' : 'Correctivo'}</td>
            <td data-label="Equipo">${report.equipmentSnapshot.brand} ${report.equipmentSnapshot.model}</td>
            <td data-label="Empresa">${company?.name || 'N/A'}</td>
            <td data-label="Ciudad">${city?.name || 'N/A'}</td>
            <td data-label="Acciones">
                <button class="btn btn-secondary action-btn view-report-btn" data-report-id="${report.id}"><i class="fas fa-eye"></i> Ver</button>
                <button class="btn btn-danger action-btn delete-report-btn" data-report-id="${report.id}"><i class="fas fa-trash"></i> Borrar</button>
            </td>
        `;
        adminReportsTableBody.appendChild(tr);
    });
    
    adminReportsTableBody.querySelectorAll('.view-report-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reportId = (e.currentTarget as HTMLButtonElement).dataset.reportId;
            const reportItem = reports.find(r => r.id === reportId);
            if (reportItem) openViewReportDetailsModal(reportItem);
        });
    });

    adminReportsTableBody.querySelectorAll('.delete-report-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const reportId = (e.currentTarget as HTMLButtonElement).dataset.reportId;
            if(!reportId) return;
            const confirmed = await showConfirmationModal('¿Está seguro de que desea eliminar este reporte? Esta acción no se puede deshacer.', 'Eliminar');
            if(confirmed) {
                await handleDeleteReport(reportId);
            }
        });
    });

    renderPaginationControls('adminReports', filteredReports.length, adminReportsPaginationContainer, renderAdminReportsTable);
    populateAdminFilterDropdowns(); 
}

function openViewReportDetailsModal(report: Report) {
    if (!viewReportDetailsModal || !viewReportDetailsContent || !viewReportIdDisplay || !downloadReportPdfButton) return;

    viewReportIdDisplay.textContent = `(ID: ${report.id.substring(0, 8)}...)`;
    
    const city = cities.find(c => c.id === report.cityId)?.name || 'N/A';
    const company = companies.find(c => c.id === report.companyId)?.name || 'N/A';
    const dependency = dependencies.find(d => d.id === report.dependencyId)?.name || 'N/A';

    viewReportDetailsContent.innerHTML = `
        <div><strong>Fecha y Hora:</strong> <span>${formatDate(report.timestamp)}</span></div>
        <div><strong>Técnico:</strong> <span>${report.workerName}</span></div>
        <div><strong>Tipo de Servicio:</strong> <span>${report.serviceType === 'preventivo' ? 'Preventivo' : 'Correctivo'}</span></div>
        
        <div><strong>Ciudad:</strong> <span>${city}</span></div>
        <div><strong>Empresa:</strong> <span>${company}</span></div>
        <div><strong>Dependencia:</strong> <span>${dependency}</span></div>
        
        <div><strong>Equipo Modelo:</strong> <span>${report.equipmentSnapshot.model}</span></div>
        <div><strong>Equipo Marca:</strong> <span>${report.equipmentSnapshot.brand}</span></div>
        <div><strong>Equipo Tipo:</strong> <span>${report.equipmentSnapshot.type}</span></div>
        <div><strong>Equipo Capacidad:</strong> <span>${report.equipmentSnapshot.capacity || 'N/A'}</span></div>
        <div><strong>Equipo Refrigerante:</strong> <span>${report.equipmentSnapshot.refrigerant || 'N/A'}</span></div>
        
        <div style="grid-column: 1 / -1;"><strong>Observaciones:</strong> <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin:0; font-size:0.9rem;">${report.observations || 'Sin observaciones.'}</pre></div>
        
        <div style="grid-column: 1 / -1;">
            <strong>Firma Cliente:</strong>
            ${report.clientSignature ? 
                `<img src="${report.clientSignature}" alt="Firma Cliente" id="view-report-signature-image" style="cursor:pointer; margin-top:5px; background-color: white; border: 1px solid #ddd; padding: 2px; border-radius: 4px;">` :
                '<span>No disponible.</span>'
            }
        </div>
    `;
    
    const signatureImg = viewReportDetailsContent.querySelector<HTMLImageElement>('#view-report-signature-image');
    if (signatureImg && report.clientSignature) {
        signatureImg.addEventListener('click', () => showImagePreviewModal(report.clientSignature));
    }
    
    downloadReportPdfButton.onclick = async () => {
        downloadReportPdfButton.disabled = true;
        downloadReportPdfButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generando...`;
        try {
            await generateReportPDF(report, cities, companies, dependencies, formatDate);
        } catch (error: any) {
            console.error("Failed to generate PDF:", error);
            showAppNotification(`Error al generar PDF: ${error.message}`, 'error');
        } finally {
            downloadReportPdfButton.disabled = false;
            downloadReportPdfButton.innerHTML = `<i class="fas fa-file-pdf"></i> Descargar PDF`;
        }
    };
    
    viewReportDetailsModal.style.display = 'flex';
}

function populateAdminFilterDropdowns() {
    if (!filterReportCity || !filterReportCompany || !filterReportTechnician) return;

    const populateSelect = (select: HTMLSelectElement, data: {id: string, name: string}[], defaultOption: string) => {
        const currentValue = select.value;
        select.innerHTML = `<option value="">${defaultOption}</option>`;
        data.sort((a,b) => a.name.localeCompare(b.name)).forEach(item => {
            const option = new Option(item.name, item.id);
            select.appendChild(option);
        });
        select.value = currentValue;
    };
    
    populateSelect(filterReportCity, cities, "Todas las ciudades");
    populateSelect(filterReportCompany, companies, "Todas las empresas");

    const technicianData = users
        .filter(u => u.role === 'worker' && u.isActive)
        .map(u => ({ id: u.id, name: u.name || u.username }));
    populateSelect(filterReportTechnician, technicianData, "Todos los técnicos");
}

function renderAdminScheduleTable() {
    if (!adminScheduleTableBody || !adminSchedulePaginationContainer) return;
    adminScheduleTableBody.innerHTML = '';

    // Delegate all calculation logic to the new `calculateSchedule` function.
    const scheduledItems = calculateSchedule(equipmentList, reports);

    if (scheduledItems.length === 0) {
        adminScheduleTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay mantenimientos próximos o vencidos. Asegúrese de que los equipos tengan reportes asociados o una fecha de último mantenimiento.</td></tr>';
        renderPaginationControls('adminSchedule', 0, adminSchedulePaginationContainer, renderAdminScheduleTable);
        return;
    }
    
    const pagination = tablePaginationStates.adminSchedule;
    const paginatedItems = scheduledItems.slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage);

    paginatedItems.forEach(item => {
        const tr = document.createElement('tr');
        const dependency = dependencies.find(d => d.id === item.equipment.dependencyId);
        tr.innerHTML = `
            <td data-label="Equipo (Modelo/Marca)">${item.equipment.model} / ${item.equipment.brand}</td>
            <td data-label="Dependencia">${dependency?.name || 'N/A'}</td>
            <td data-label="Último Mtto.">${formatDate(item.lastMaintenanceDate, false)}</td>
            <td data-label="Próximo Mtto.">${formatDate(item.nextDueDate, false)}</td>
            <td data-label="Estado" class="${item.statusColorClass}">${item.statusText}</td>
            <td data-label="Acciones">
                <button class="btn btn-secondary action-btn create-report-from-schedule-btn" data-equipment-id="${item.equipment.id}"><i class="fas fa-file-signature"></i> Crear Reporte</button>
            </td>
        `;
        adminScheduleTableBody.appendChild(tr);
    });

    adminScheduleTableBody.querySelectorAll<HTMLButtonElement>('.create-report-from-schedule-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const equipmentId = (e.currentTarget as HTMLButtonElement).dataset.equipmentId;
            const equipment = equipmentList.find(eq => eq.id === equipmentId);
            if(equipment) openReportFormModal(equipment);
            else showAppNotification('No se encontró el equipo.', 'error');
        });
    });

    renderPaginationControls('adminSchedule', scheduledItems.length, adminSchedulePaginationContainer, renderAdminScheduleTable);
}

function renderAdminEquipmentTable() {
    if (!adminEquipmentTableBody || !adminEquipmentPaginationContainer) return;
    adminEquipmentTableBody.innerHTML = '';

    const searchTerm = tableSearchTerms.adminEquipment.toLowerCase();
    const filteredEquipment = equipmentList.filter(eq => 
        eq.model.toLowerCase().includes(searchTerm) ||
        eq.brand.toLowerCase().includes(searchTerm) ||
        eq.type.toLowerCase().includes(searchTerm) ||
        eq.id.toLowerCase().includes(searchTerm) ||
        (companies.find(c=>c.id === eq.companyId)?.name || '').toLowerCase().includes(searchTerm) ||
        (dependencies.find(d=>d.id === eq.dependencyId)?.name || '').toLowerCase().includes(searchTerm)
    );

    if (filteredEquipment.length === 0) {
        adminEquipmentTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No se encontraron equipos. Use el botón "Agregar Equipo" para empezar.</td></tr>';
        renderPaginationControls('adminEquipment', 0, adminEquipmentPaginationContainer, renderAdminEquipmentTable);
        return;
    }

    const pagination = tablePaginationStates.adminEquipment;
    const paginatedItems = filteredEquipment.slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage);

    paginatedItems.forEach(eq => {
        const tr = document.createElement('tr');
        const company = companies.find(c => c.id === eq.companyId);
        const dependency = dependencies.find(d => d.id === eq.dependencyId);
        tr.innerHTML = `
            <td data-label="ID Equipo">${eq.id}</td>
            <td data-label="Modelo">${eq.model}</td>
            <td data-label="Marca">${eq.brand}</td>
            <td data-label="Tipo">${eq.type}</td>
            <td data-label="Capacidad">${eq.capacity || 'N/A'}</td>
            <td data-label="Empresa">${company?.name || 'N/A'}</td>
            <td data-label="Dependencia">${dependency?.name || 'N/A'}</td>
            <td data-label="Periodicidad (Meses)">${eq.periodicityMonths}</td>
            <td data-label="Acciones">
                <button class="btn btn-secondary action-btn download-qr-btn" data-equipment-id="${eq.id}" data-equipment-model="${eq.model}"><i class="fas fa-qrcode"></i> QR</button>
                <button class="btn btn-secondary action-btn edit-entity-btn" data-entity-type="equipment" data-entity-id="${eq.id}"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-danger action-btn delete-entity-btn" data-entity-type="equipment" data-entity-id="${eq.id}"><i class="fas fa-trash"></i> Borrar</button>
            </td>
        `;
        adminEquipmentTableBody.appendChild(tr);
    });

    addEntityActionListeners(adminEquipmentTableBody);
    renderPaginationControls('adminEquipment', filteredEquipment.length, adminEquipmentPaginationContainer, renderAdminEquipmentTable);
}

async function handleDownloadQrCode(e: MouseEvent) {
    const button = (e.target as HTMLElement).closest('.download-qr-btn') as HTMLButtonElement;
    const equipmentId = button.dataset.equipmentId;
    const equipmentModel = button.dataset.equipmentModel;

    if (!equipmentId || !equipmentModel) {
        showAppNotification('Faltan datos del equipo para generar QR.', 'error');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const qrData = JSON.stringify({ equipmentId });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo obtener el contexto del canvas.');

        const qrSize = 250;
        const padding = 20;
        const textHeight = 40;
        const borderRadius = 8;
        
        canvas.width = qrSize + padding * 2;
        canvas.height = qrSize + padding * 2 + textHeight;

        // Draw a white rounded rectangle background
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(borderRadius, 0);
        ctx.lineTo(canvas.width - borderRadius, 0);
        ctx.quadraticCurveTo(canvas.width, 0, canvas.width, borderRadius);
        ctx.lineTo(canvas.width, canvas.height - borderRadius);
        ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - borderRadius, canvas.height);
        ctx.lineTo(borderRadius, canvas.height);
        ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - borderRadius);
        ctx.lineTo(0, borderRadius);
        ctx.quadraticCurveTo(0, 0, borderRadius, 0);
        ctx.closePath();
        ctx.fill();

        // Generate QR code onto an offscreen canvas, then draw it onto our main canvas
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, qrData, {
            errorCorrectionLevel: 'H',
            width: qrSize,
            margin: 0,
            color: {
                dark: '#0D1117', // QR code color
                light: '#FFFFFF'  // Transparent background
            }
        });
        ctx.drawImage(qrCanvas, padding, padding);

        // Draw text below QR code
        ctx.fillStyle = '#0D1117'; // Dark text
        ctx.font = 'bold 12px "Exo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(equipmentId, canvas.width / 2, qrSize + padding * 2 + 22);

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `QR_${equipmentModel.replace(/\s+/g, '_')}_${equipmentId.substring(0,8)}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error: any) {
        console.error('Error generating QR code:', error);
        showAppNotification(`Error al generar QR: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-qrcode"></i> QR';
    }
}

function handleTabClick(event: MouseEvent, clickedLink?: HTMLButtonElement) {
    const target = clickedLink || event.currentTarget as HTMLButtonElement;
    tabLinks.forEach(link => link.classList.remove('active'));
    tabContents.forEach(content => (content as HTMLElement).style.display = 'none');
    target.classList.add('active');
    const tabId = target.dataset.tab;
    if (tabId) {
        const activeTab = document.getElementById(tabId) as HTMLElement;
        if (activeTab) {
            activeTab.style.display = 'block';
            if (tabId === 'cities-tab') renderCitiesTable();
            else if (tabId === 'companies-tab') renderCompaniesTable();
            else if (tabId === 'dependencies-tab') renderDependenciesTable();
            else if (tabId === 'employees-tab') renderEmployeesTable();
        }
    }
}

function renderCitiesTable() { 
    if(!citiesTableBody) return;
    citiesTableBody.innerHTML = '';
    cities.forEach(city => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Nombre">${city.name}</td>
            <td data-label="Acciones">
                <button class="btn btn-secondary action-btn edit-entity-btn" data-entity-type="city" data-entity-id="${city.id}"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-danger action-btn delete-entity-btn" data-entity-type="city" data-entity-id="${city.id}"><i class="fas fa-trash"></i> Borrar</button>
            </td>
        `;
        citiesTableBody.appendChild(tr);
    });
    addEntityActionListeners(citiesTableBody);
}

function renderCompaniesTable() { 
    if(!companiesTableBody) return;
    companiesTableBody.innerHTML = '';
    companies.forEach(company => {
        const city = cities.find(c => c.id === company.cityId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Nombre">${company.name}</td>
            <td data-label="Ciudad">${city?.name || 'N/A'}</td>
            <td data-label="Acciones">
                <button class="btn btn-secondary action-btn edit-entity-btn" data-entity-type="company" data-entity-id="${company.id}"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-danger action-btn delete-entity-btn" data-entity-type="company" data-entity-id="${company.id}"><i class="fas fa-trash"></i> Borrar</button>
            </td>
        `;
        companiesTableBody.appendChild(tr);
    });
    addEntityActionListeners(companiesTableBody);
}

function renderDependenciesTable() { 
    if(!dependenciesTableBody) return;
    dependenciesTableBody.innerHTML = '';
    dependencies.forEach(dep => {
        const company = companies.find(c => c.id === dep.companyId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Nombre">${dep.name}</td>
            <td data-label="Empresa">${company?.name || 'N/A'}</td>
            <td data-label="Acciones">
                <button class="btn btn-secondary action-btn edit-entity-btn" data-entity-type="dependency" data-entity-id="${dep.id}"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-danger action-btn delete-entity-btn" data-entity-type="dependency" data-entity-id="${dep.id}"><i class="fas fa-trash"></i> Borrar</button>
            </td>
        `;
        dependenciesTableBody.appendChild(tr);
    });
    addEntityActionListeners(dependenciesTableBody);
}

function renderEmployeesTable() { 
    if(!employeesTableBody) return;
    employeesTableBody.innerHTML = '';
    const employeeUsers = users.filter(u => u.role === 'worker');
    employeeUsers.forEach(user => {
        const tr = document.createElement('tr');
        const statusClass = user.isActive ? 'status-active' : 'status-inactive';
        const statusText = user.isActive ? 'Activo' : 'Inactivo';
        tr.innerHTML = `
            <td data-label="Nombre">${user.name}</td>
            <td data-label="Cédula (Usuario)">${user.cedula}</td>
            <td data-label="Estado" class="${statusClass}">${statusText}</td>
            <td data-label="Acciones">
                <button class="btn btn-secondary action-btn edit-entity-btn" data-entity-type="employee" data-entity-id="${user.id}"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn ${user.isActive ? 'btn-warning' : 'btn-success'} action-btn toggle-employee-status-btn" data-user-id="${user.id}" data-current-status="${user.isActive}">
                    <i class="fas ${user.isActive ? 'fa-user-slash' : 'fa-user-check'}"></i> ${user.isActive ? 'Desactivar' : 'Activar'}
                </button>
            </td>
        `;
        employeesTableBody.appendChild(tr);
    });
    addEntityActionListeners(employeesTableBody);
}


function addEntityActionListeners(container: HTMLElement) { 
    container.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const editBtn = target.closest('.edit-entity-btn') as HTMLButtonElement;
        const deleteBtn = target.closest('.delete-entity-btn') as HTMLButtonElement;
        const toggleStatusBtn = target.closest('.toggle-employee-status-btn') as HTMLButtonElement;
        const downloadQrBtn = target.closest('.download-qr-btn') as HTMLButtonElement;

        if (editBtn) {
            const entityType = editBtn.dataset.entityType as EntityType;
            const entityId = editBtn.dataset.entityId;
            openEntityFormModal(entityType, entityId);
        } else if (deleteBtn) {
            const entityType = deleteBtn.dataset.entityType as EntityType;
            const entityId = deleteBtn.dataset.entityId;
            if (entityId) {
                handleDeleteEntity(entityType, entityId).catch(err => console.error("Error handling delete:", err));
            }
        } else if (toggleStatusBtn) {
            handleToggleEmployeeStatus(e as MouseEvent).catch(err => console.error("Error handling toggle status:", err));
        } else if (downloadQrBtn) {
            handleDownloadQrCode(e as MouseEvent).catch(err => console.error("Error handling QR download:", err));
        }
    });
}

function openEntityFormModal(type: EntityType, id?: string) {
    if (!entityFormModal || !entityForm || !entityFormFieldsContainer || !entityFormTitle || !entityTypeInput || !entityIdInput) return;

    entityForm.reset();
    entityFormFieldsContainer.innerHTML = '';
    entityTypeInput.value = type;
    entityIdInput.value = id || '';
    const isEditing = !!id;
    let title = isEditing ? 'Editar' : 'Agregar';
    let fieldsHtml = '';

    const createFormGroup = (label: string, inputHtml: string): string => `
        <div class="form-group">
            <label>${label}</label>
            ${inputHtml}
        </div>`;

    const createSelectOptions = (items: { id: string, name: string }[], selectedId?: string): string => {
        return items.map(item => `<option value="${item.id}" ${item.id === selectedId ? 'selected' : ''}>${item.name}</option>`).join('');
    };
    
    const createStringOptions = (items: string[], selectedValue?: string): string => {
        return items.map(item => `<option value="${item}" ${item === selectedValue ? 'selected' : ''}>${item}</option>`).join('');
    };

    switch (type) {
        case 'city': {
            title += ' Ciudad';
            const city = isEditing ? cities.find(c => c.id === id) : null;
            fieldsHtml = createFormGroup('Nombre:', `<input type="text" name="name" value="${city?.name || ''}" required>`);
            break;
        }
        case 'company': {
            title += ' Empresa';
            const company = isEditing ? companies.find(c => c.id === id) : null;
            fieldsHtml = `
                ${createFormGroup('Nombre:', `<input type="text" name="name" value="${company?.name || ''}" required>`)}
                ${createFormGroup('Ciudad:', `<select name="city_id" required><option value="">Seleccione...</option>${createSelectOptions(cities, company?.cityId)}</select>`)}
            `;
            break;
        }
        case 'dependency': {
            title += ' Dependencia';
            const dep = isEditing ? dependencies.find(d => d.id === id) : null;
            fieldsHtml = `
                ${createFormGroup('Nombre:', `<input type="text" name="name" value="${dep?.name || ''}" required>`)}
                ${createFormGroup('Empresa:', `<select name="company_id" required><option value="">Seleccione...</option>${createSelectOptions(companies, dep?.companyId)}</select>`)}
            `;
            break;
        }
        case 'employee': {
            title += ' Empleado';
            const user = isEditing ? users.find(u => u.id === id) : null;
            fieldsHtml = `
                ${createFormGroup('Nombre Completo:', `<input type="text" name="name" value="${user?.name || ''}" required>`)}
                ${createFormGroup('Cédula (Usuario):', `<input type="text" name="cedula" value="${user?.cedula || ''}" required ${isEditing ? 'disabled' : ''}>`)}
                ${createFormGroup(isEditing ? 'Nueva Contraseña (dejar en blanco para no cambiar):' : 'Contraseña:', `<input type="password" name="password" ${!isEditing ? 'required' : ''}>`)}
            `;
            break;
        }
        case 'equipment': {
            title += ' Equipo';
            const eq = isEditing ? equipmentList.find(e => e.id === id) : null;
            fieldsHtml = `
                <div class="form-grid">
                ${createFormGroup('Modelo:', `<input type="text" name="model" value="${eq?.model || ''}" required>`)}
                ${createFormGroup('Marca:', `<input type="text" name="brand" value="${eq?.brand || ''}" required>`)}
                ${createFormGroup('Tipo:', `<select name="type" required>${createStringOptions(equipmentTypes, eq?.type)}</select>`)}
                ${createFormGroup('Capacidad (BTU/TR):', `<input type="text" name="capacity" value="${eq?.capacity || ''}">`)}
                ${createFormGroup('Refrigerante:', `<select name="refrigerant">${createStringOptions(refrigerantTypes, eq?.refrigerant)}</select>`)}
                ${createFormGroup('Periodicidad (Meses):', `<input type="number" name="periodicityMonths" value="${eq?.periodicityMonths || '6'}" required min="0">`)}
                ${createFormGroup('Fecha Último Mtto.:', `<input type="date" name="lastMaintenanceDate" value="${eq?.lastMaintenanceDate ? eq.lastMaintenanceDate.split('T')[0] : ''}">`)}
                </div>
                <hr/>
                <h4>Ubicación</h4>
                ${createFormGroup('Ciudad:', `<select id="entity-form-city-id" name="cityId" required><option value="">Seleccione...</option>${createSelectOptions(cities, eq?.cityId)}</select>`)}
                ${createFormGroup('Empresa:', `<select id="entity-form-company-id" name="companyId" required><option value="">Seleccione una ciudad...</option></select>`)}
                ${createFormGroup('Dependencia:', `<select id="entity-form-dependency-id" name="dependencyId" required><option value="">Seleccione una empresa...</option></select>`)}
            `;
            break;
        }
    }

    entityFormTitle.innerHTML = `<i class="fas fa-edit"></i> ${title}`;
    entityFormFieldsContainer.innerHTML = fieldsHtml;

    if (type === 'equipment') {
        const eq = isEditing ? equipmentList.find(e => e.id === id) : null;
        const citySelect = entityFormFieldsContainer.querySelector<HTMLSelectElement>('#entity-form-city-id');
        const companySelect = entityFormFieldsContainer.querySelector<HTMLSelectElement>('#entity-form-company-id');
        const dependencySelect = entityFormFieldsContainer.querySelector<HTMLSelectElement>('#entity-form-dependency-id');

        const populateCompanies = (cityId: string, selectedCompanyId?: string) => {
            if (!companySelect) return;
            const filtered = companies.filter(c => c.cityId === cityId);
            companySelect.innerHTML = `<option value="">Seleccione...</option>${createSelectOptions(filtered, selectedCompanyId)}`;
            populateDependencies(companySelect.value);
        };
        const populateDependencies = (companyId: string, selectedDependencyId?: string) => {
            if (!dependencySelect) return;
            const filtered = dependencies.filter(d => d.companyId === companyId);
            dependencySelect.innerHTML = `<option value="">Seleccione...</option>${createSelectOptions(filtered, selectedDependencyId)}`;
        };

        citySelect?.addEventListener('change', () => populateCompanies(citySelect.value));
        companySelect?.addEventListener('change', () => populateDependencies(companySelect.value));

        if (eq?.cityId) {
            populateCompanies(eq.cityId, eq.companyId);
        }
        if (eq?.companyId) {
            populateDependencies(eq.companyId, eq.dependencyId);
        }
    }
    entityFormModal.style.display = 'flex';
}

async function handleDeleteEntity(type: EntityType, id: string) {
    let entityName = '';
    let isUsed = false;
    let usageMessage = '';

    switch (type) {
        case 'city':
            entityName = cities.find(c => c.id === id)?.name || id;
            if (companies.some(c => c.cityId === id)) {
                isUsed = true;
                usageMessage = 'No se puede eliminar la ciudad porque está asignada a una o más empresas.';
            }
            break;
        case 'company':
            entityName = companies.find(c => c.id === id)?.name || id;
            if (dependencies.some(d => d.companyId === id)) {
                isUsed = true;
                usageMessage = 'No se puede eliminar la empresa porque está asignada a una o más dependencias.';
            }
            break;
        case 'dependency':
            entityName = dependencies.find(d => d.id === id)?.name || id;
            if (equipmentList.some(eq => eq.dependencyId === id)) {
                isUsed = true;
                usageMessage = 'No se puede eliminar la dependencia porque tiene equipos asignados.';
            }
            break;
        case 'equipment':
            entityName = equipmentList.find(eq => eq.id === id)?.model || id;
            break;
    }
    
    if (isUsed) {
        showAppNotification(usageMessage, 'error');
        return;
    }

    const confirmed = await showConfirmationModal(`¿Seguro que desea eliminar "${entityName}"? Esta acción no se puede deshacer.`, 'Eliminar');
    if (!confirmed) return;

    showLoader('Eliminando...');
    let error: any = null;

    try {
        let dbError: any = null;
        switch (type) {
            case 'city': {
                ({ error: dbError } = await supabase.from(TABLE_CITIES).delete().eq('id', id));
                if (!dbError) { await fetchCities(); renderCitiesTable(); }
                break;
            }
            case 'company': {
                ({ error: dbError } = await supabase.from(TABLE_COMPANIES).delete().eq('id', id));
                if (!dbError) { await fetchCompanies(); renderCompaniesTable(); }
                break;
            }
            case 'dependency': {
                ({ error: dbError } = await supabase.from(TABLE_DEPENDENCIES).delete().eq('id', id));
                if (!dbError) { await fetchDependencies(); renderDependenciesTable(); }
                break;
            }
            case 'equipment': {
                ({ error: dbError } = await supabase.from(TABLE_EQUIPMENT).delete().eq('id', id));
                if (!dbError) {
                    await fetchEquipment();
                    renderAdminEquipmentTable();
                    renderAdminScheduleTable();
                }
                break;
            }
        }
        error = dbError;
    } catch(e) {
        error = e;
    }

    hideLoader();
    if (error) {
        showAppNotification(`Error al eliminar: ${error.message}`, 'error');
        console.error(`Error deleting ${type}:`, error);
    } else {
        showAppNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} eliminado exitosamente.`, 'success');
    }
}

async function handleToggleEmployeeStatus(e: MouseEvent) {
    const button = (e.target as HTMLElement).closest('.toggle-employee-status-btn') as HTMLButtonElement;
    const userId = button.dataset.userId;
    const currentStatus = button.dataset.currentStatus === 'true';
    if (!userId) return;

    const newStatus = !currentStatus;
    const actionText = newStatus ? "activar" : "desactivar";
    const user = users.find(u => u.id === userId);

    const confirmed = await showConfirmationModal(`¿Seguro que desea ${actionText} a ${user?.name || 'este usuario'}?`, newStatus ? 'Activar' : 'Desactivar');
    if (!confirmed) return;

    showLoader(`${newStatus ? "Activando" : "Desactivando"} usuario...`);
    const { error } = await supabase.from(TABLE_USERS).update({ is_active: newStatus }).eq('id', userId);
    hideLoader();

    if (error) {
        showAppNotification('Error al cambiar el estado del empleado.', 'error');
    } else {
        showAppNotification('Estado del empleado actualizado.', 'success');
        await fetchUsers();
        renderEmployeesTable();
    }
}
async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    loginError.textContent = '';
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        loginError.textContent = 'Por favor, ingrese usuario y contraseña.';
        return;
    }

    const user = users.find(u => u.username === username);

    if (user && user.password === password) {
        if (!user.isActive) {
            loginError.textContent = 'Este usuario está inactivo. Contacte al administrador.';
            return;
        }
        await setupSession(user);
    } else {
        loginError.textContent = 'Usuario o contraseña incorrectos.';
    }
}

function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    loginScreen.style.display = 'flex';
    appScreen.style.display = 'none';
    bottomNav.style.display = 'none';
}

function openAdminPinModal() {
    adminPinForm.reset();
    adminPinError.textContent = '';
    adminPinModal.style.display = 'flex';
}

function openReportFormModal(equipment?: Equipment) {
    if (!reportFormModal || !maintenanceReportForm || !currentUser) {
        console.error("Report form modal or user not available.");
        return;
    }

    // --- 1. Reset form and state ---
    maintenanceReportForm.reset();
    reportIdInput.value = '';
    currentReportSignatureDataUrl = null;
    signaturePreviewImage.src = '#';
    signaturePreviewImage.style.display = 'none';
    signaturePlaceholderText.style.display = 'inline';

    // --- 2. Set worker name ---
    reportWorkerNameInput.value = currentUser.name || currentUser.username;
    
    // --- 3. Get DOM elements ---
    const allEquipmentDetailInputs = [
        reportEquipmentModelInput, reportEquipmentBrandInput, reportEquipmentTypeSelect,
        reportEquipmentCapacityInput, reportEquipmentRefrigerantSelect,
        reportCitySelect, reportCompanySelect, reportDependencySelect
    ];

    // --- 4. Define Helper Functions ---
    const populateOptions = (select: HTMLSelectElement, options: string[], selected?: string) => {
        select.innerHTML = options.map(opt => `<option value="${opt}" ${opt === selected ? 'selected' : ''}>${opt}</option>`).join('');
    };
    const populateLocationSelect = (select: HTMLSelectElement, items: { id: string, name: string }[], selectedId?: string) => {
        select.innerHTML = '<option value="">Seleccione...</option>';
        items.sort((a,b) => a.name.localeCompare(b.name)).forEach(item => {
            const option = new Option(item.name, item.id);
            if (item.id === selectedId) option.selected = true;
            select.add(option);
        });
    };
    const populateCompaniesForCity = (cityId: string, selectedCompanyId?: string) => {
        const filteredCompanies = companies.filter(c => c.cityId === cityId);
        populateLocationSelect(reportCompanySelect, filteredCompanies, selectedCompanyId);
    };
    const populateDependenciesForCompany = (companyId: string, selectedDependencyId?: string) => {
        const filteredDependencies = dependencies.filter(d => d.companyId === companyId);
        populateLocationSelect(reportDependencySelect, filteredDependencies, selectedDependencyId);
    };

    // --- 5. Populate static dropdowns (always do this) ---
    populateOptions(reportEquipmentTypeSelect, equipmentTypes);
    populateOptions(reportEquipmentRefrigerantSelect, refrigerantTypes);
    populateLocationSelect(reportCitySelect, cities);

    // --- 6. Attach location onchange listeners (always do this) ---
    reportCitySelect.onchange = () => {
        populateCompaniesForCity(reportCitySelect.value);
        populateDependenciesForCompany(''); // Clear dependencies when city changes
    };
    reportCompanySelect.onchange = () => {
        populateDependenciesForCompany(reportCompanySelect.value);
    };

    // --- 7. Main Logic: Differentiate flow based on `equipment` parameter ---
    if (equipment) {
        // SCENARIO A: QR Scan or Schedule click. Equipment is provided.
        if (manualEquipmentSelectorContainer) manualEquipmentSelectorContainer.style.display = 'none';
        
        // Fill form with provided equipment data and disable fields.
        reportEquipmentIdHidden.value = equipment.id;
        reportEquipmentModelInput.value = equipment.model;
        reportEquipmentBrandInput.value = equipment.brand;
        reportEquipmentTypeSelect.value = equipment.type;
        reportEquipmentCapacityInput.value = equipment.capacity || '';
        reportEquipmentRefrigerantSelect.value = equipment.refrigerant || '';
        reportCitySelect.value = equipment.cityId;
        populateCompaniesForCity(equipment.cityId, equipment.companyId);
        populateDependenciesForCompany(equipment.companyId, equipment.dependencyId);
        
        allEquipmentDetailInputs.forEach(input => input.disabled = true);
        
    } else {
        // SCENARIO B: Manual Report button click. No equipment provided.
        if (manualEquipmentSelectorContainer) manualEquipmentSelectorContainer.style.display = 'block';

        // Clear and disable all equipment fields until a selection is made
        allEquipmentDetailInputs.forEach(input => input.disabled = true);
        reportEquipmentIdHidden.value = '';

        // Populate the main equipment selector dropdown
        equipmentSelector.innerHTML = '<option value="">-- Elija un equipo existente --</option>';
        equipmentList
            .sort((a,b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`))
            .forEach(eq => {
                const dep = dependencies.find(d => d.id === eq.dependencyId);
                const comp = companies.find(c => c.id === dep?.companyId);
                const optionText = `${eq.brand} ${eq.model}  (${comp?.name || 'N/A'} - ${dep?.name || 'N/A'})`;
                equipmentSelector.add(new Option(optionText, eq.id));
            });

        // Set up the onchange handler for the selector
        equipmentSelector.onchange = () => {
            const selectedId = equipmentSelector.value;
            const selectedEquipment = equipmentList.find(eq => eq.id === selectedId);

            if (selectedEquipment) {
                // If a valid equipment is selected, populate the form with its data.
                reportEquipmentIdHidden.value = selectedEquipment.id;
                reportEquipmentModelInput.value = selectedEquipment.model;
                reportEquipmentBrandInput.value = selectedEquipment.brand;
                reportEquipmentTypeSelect.value = selectedEquipment.type;
                reportEquipmentCapacityInput.value = selectedEquipment.capacity || '';
                reportEquipmentRefrigerantSelect.value = selectedEquipment.refrigerant || '';
                reportCitySelect.value = selectedEquipment.cityId;
                populateCompaniesForCity(selectedEquipment.cityId, selectedEquipment.companyId);
                populateDependenciesForCompany(selectedEquipment.companyId, selectedEquipment.dependencyId);
                allEquipmentDetailInputs.forEach(input => input.disabled = true);
            } else {
                // If user selects the placeholder, clear and disable the form again.
                maintenanceReportForm.reset();
                reportWorkerNameInput.value = currentUser.name || currentUser.username;
                allEquipmentDetailInputs.forEach(input => input.disabled = true);
                reportEquipmentIdHidden.value = '';
            }
        };
    }
    
    // The service type should always be editable, regardless of the flow.
    reportServiceTypeSelect.disabled = false;
    
    reportFormModal.style.display = 'flex';
}
function renderPaginationControls(tableKey: MaintenanceTableKey, totalItems: number, container: HTMLElement | null, renderFn: () => void) {
    if (!container) return;
    const state = tablePaginationStates[tableKey];
    if (totalItems <= 0) {
        container.innerHTML = '';
        return;
    }
    
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    state.currentPage = Math.min(state.currentPage, totalPages) || 1;

    const startItem = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endItem = Math.min(startItem + state.itemsPerPage - 1, totalItems);

    container.innerHTML = `
        <div class="items-per-page-selector">
            <label for="${tableKey}-items-per-page">Items por pág:</label>
            <select id="${tableKey}-items-per-page" data-table-key="${tableKey}">
                <option value="5" ${state.itemsPerPage === 5 ? 'selected' : ''}>5</option>
                <option value="10" ${state.itemsPerPage === 10 ? 'selected' : ''}>10</option>
                <option value="20" ${state.itemsPerPage === 20 ? 'selected' : ''}>20</option>
                <option value="50" ${state.itemsPerPage === 50 ? 'selected' : ''}>50</option>
            </select>
        </div>
        <div class="page-navigation">
            <button class="btn btn-pagination" data-action="prev" data-table-key="${tableKey}" ${state.currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
            <span class="page-info">${endItem > 0 ? `${startItem}-${endItem}`: 0} de ${totalItems}</span>
            <button class="btn btn-pagination" data-action="next" data-table-key="${tableKey}" ${state.currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
        </div>
    `;

    container.querySelector('select')?.addEventListener('change', (e) => {
        const select = e.target as HTMLSelectElement;
        const key = select.dataset.tableKey as MaintenanceTableKey;
        tablePaginationStates[key].itemsPerPage = parseInt(select.value, 10);
        tablePaginationStates[key].currentPage = 1;
        renderFn();
    });

    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget as HTMLButtonElement;
            const key = button.dataset.tableKey as MaintenanceTableKey;
            const action = button.dataset.action;
            if (action === 'prev') tablePaginationStates[key].currentPage--;
            if (action === 'next') tablePaginationStates[key].currentPage++;
            renderFn();
        });
    });
}

function openSignatureModal() {
    if (!signatureModal || !signatureCanvas) return;
    signatureModal.style.display = 'flex';
    
    // Defer initialization and resizing until modal is visible
    setTimeout(() => {
        if (!signaturePad) {
            signaturePad = new SignaturePad(signatureCanvas, {
                backgroundColor: 'rgb(255, 255, 255)', // Set background color
                penColor: 'rgb(0, 0, 0)'
            });
        }
        resizeCanvas(signatureCanvas);
        signaturePad.clear(); // Clear any previous drawing
    }, 10); // A small timeout allows the browser to render the modal first
}

function handleSaveSignature() {
    if (!signaturePad || !signatureModal || !signaturePreviewImage || !signaturePlaceholderText) return;

    if (signaturePad.isEmpty()) {
        currentReportSignatureDataUrl = null;
        signaturePreviewImage.src = '#';
        signaturePreviewImage.style.display = 'none';
        signaturePlaceholderText.style.display = 'inline';
        showAppNotification('El panel está vacío. No se guardó ninguna firma.', 'warning');
    } else {
        currentReportSignatureDataUrl = signaturePad.toDataURL('image/png'); 
        signaturePreviewImage.src = currentReportSignatureDataUrl;
        signaturePreviewImage.style.display = 'block';
        signaturePlaceholderText.style.display = 'none';
        isSignaturePadDirty = true;
    }
    signatureModal.style.display = 'none';
}

async function handleEntityFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    showLoader('Guardando...');
    const formData = new FormData(entityForm);
    const id = entityIdInput.value;
    const type = entityTypeInput.value as EntityType;
    let error: any = null;

    try {
        switch (type) {
            case 'city': {
                const data = { name: formData.get('name') as string };
                if (id) {
                    ({ error } = await supabase.from(TABLE_CITIES).update(data).eq('id', id));
                } else {
                    ({ error } = await supabase.from(TABLE_CITIES).insert([data]));
                }
                if (!error) { await fetchCities(); renderCitiesTable(); }
                break;
            }
            case 'company': {
                const data = { name: formData.get('name') as string, city_id: formData.get('city_id') as string };
                if (id) {
                    ({ error } = await supabase.from(TABLE_COMPANIES).update(data).eq('id', id));
                } else {
                    ({ error } = await supabase.from(TABLE_COMPANIES).insert([data]));
                }
                if (!error) { await fetchCompanies(); renderCompaniesTable(); }
                break;
            }
            case 'dependency': {
                const data = { name: formData.get('name') as string, company_id: formData.get('company_id') as string };
                if (id) {
                    ({ error } = await supabase.from(TABLE_DEPENDENCIES).update(data).eq('id', id));
                } else {
                    ({ error } = await supabase.from(TABLE_DEPENDENCIES).insert([data]));
                }
                if (!error) { await fetchDependencies(); renderDependenciesTable(); }
                break;
            }
            case 'employee': {
                const password = formData.get('password') as string;
                if (id) { // Editing
                    const data: Database['public']['Tables']['maintenance_users']['Update'] = {
                        name: formData.get('name') as string,
                    };
                    if (password) {
                        data.password = password;
                    }
                    ({ error } = await supabase.from(TABLE_USERS).update(data).eq('id', id));
                } else { // Adding
                    const cedula = formData.get('cedula') as string;
                    const data: Database['public']['Tables']['maintenance_users']['Insert'] = {
                        name: formData.get('name') as string,
                        cedula: cedula,
                        username: cedula,
                        password: password,
                        role: 'worker',
                        is_active: true,
                    };
                    ({ error } = await supabase.from(TABLE_USERS).insert([data]));
                }
                if (!error) { await fetchUsers(); renderEmployeesTable(); }
                break;
            }
            case 'equipment': {
                const lastMaintenance = formData.get('lastMaintenanceDate') as string;
                const dbData = {
                    model: formData.get('model') as string,
                    brand: formData.get('brand') as string,
                    type: formData.get('type') as string,
                    capacity: (formData.get('capacity') as string) || null,
                    refrigerant: (formData.get('refrigerant') as string) || null,
                    periodicity_months: parseInt(formData.get('periodicityMonths') as string, 10),
                    last_maintenance_date: lastMaintenance || null,
                    city_id: formData.get('cityId') as string,
                    company_id: formData.get('companyId') as string,
                    dependency_id: formData.get('dependencyId') as string,
                };

                if (id) {
                    ({ error } = await supabase.from(TABLE_EQUIPMENT).update(dbData).eq('id', id));
                } else {
                    const insertData: Database['public']['Tables']['maintenance_equipment']['Insert'] = { ...dbData, id: generateId() };
                    ({ error } = await supabase.from(TABLE_EQUIPMENT).insert([insertData]));
                }
                if (!error) {
                    await fetchEquipment();
                    renderAdminEquipmentTable();
                    renderAdminScheduleTable();
                }
                break;
            }
        }
    } catch(e) {
        error = e;
    }

    hideLoader();
    if (error) {
        showAppNotification(`Error al guardar: ${error.message}`, 'error');
        console.error(`Error saving ${type}:`, error);
    } else {
        showAppNotification('Datos guardados exitosamente.', 'success');
        entityFormModal.style.display = 'none';
    }
}
async function handleAdminPinSubmit(e: SubmitEvent) {
    e.preventDefault();
    adminPinError.textContent = '';
    const password = adminPinInput.value.trim();
    const adminUser = users.find(u => u.role === 'admin' && u.username === 'admin');

    if (adminUser && adminUser.password === password) {
        adminPinModal.style.display = 'none';
        await setupSession(adminUser);
    } else {
        adminPinError.textContent = 'Contraseña de administrador incorrecta.';
    }
}
async function handleChangePinSubmit(e: SubmitEvent) {
    e.preventDefault();
    changePinError.textContent = '';

    const currentPassword = currentPinInput.value;
    const newPassword = newPinInput.value;
    const confirmPassword = confirmNewPinInput.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        changePinError.textContent = 'Todos los campos son obligatorios.';
        return;
    }
    if (newPassword !== confirmPassword) {
        changePinError.textContent = 'Las nuevas contraseñas no coinciden.';
        return;
    }
    if (newPassword.length < 6) {
        changePinError.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
        return;
    }

    const adminUser = users.find(u => u.role === 'admin');
    if (!adminUser || adminUser.password !== currentPassword) {
        changePinError.textContent = 'La contraseña actual es incorrecta.';
        return;
    }

    showLoader('Actualizando contraseña...');
    const { error } = await supabase.from(TABLE_USERS)
        .update({ password: newPassword })
        .eq('id', adminUser.id);
    hideLoader();

    if (error) {
        showAppNotification('Error al cambiar la contraseña.', 'error');
        changePinError.textContent = `Error: ${error.message}`;
    } else {
        showAppNotification('Contraseña de administrador actualizada con éxito.', 'success');
        changePinModal.style.display = 'none';
        // Re-fetch users to update local state with new password hash if needed
        await fetchUsers();
    }
}
async function handleMaintenanceFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!currentUser) {
        showAppNotification('Error: No se ha identificado al usuario.', 'error');
        return;
    }
    
    const equipmentId = reportEquipmentIdHidden.value;
    if (!equipmentId) {
        showAppNotification('Debe seleccionar un equipo para crear un reporte.', 'warning');
        return;
    }


    showLoader('Guardando reporte...');
    
    try {
        const equipmentSnapshot = {
            id: equipmentId,
            model: reportEquipmentModelInput.value,
            brand: reportEquipmentBrandInput.value,
            type: reportEquipmentTypeSelect.value,
            capacity: reportEquipmentCapacityInput.value || undefined,
            refrigerant: reportEquipmentRefrigerantSelect.value || undefined,
        };

        const newReport: Database['public']['Tables']['maintenance_reports']['Insert'] = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            service_type: reportServiceTypeSelect.value as 'preventivo' | 'correctivo',
            observations: reportObservationsTextarea.value || null,
            equipment_snapshot: equipmentSnapshot,
            city_id: reportCitySelect.value,
            company_id: reportCompanySelect.value,
            dependency_id: reportDependencySelect.value,
            worker_id: currentUser.id,
            worker_name: currentUser.name || currentUser.username,
            client_signature: currentReportSignatureDataUrl
        };

        const { error: reportError } = await supabase.from(TABLE_REPORTS).insert([newReport]);
        
        if (reportError) throw reportError;

        // If the report is for an existing equipment, update its last maintenance date, regardless of service type.
        // This resets the schedule timer after any service.
        if (equipmentId !== 'MANUAL_NO_ID') {
            const { error: equipmentUpdateError } = await supabase
                .from(TABLE_EQUIPMENT)
                .update({ last_maintenance_date: newReport.timestamp })
                .eq('id', equipmentId);
            
            if (equipmentUpdateError) {
                // Log the error but don't fail the whole operation, the report is already saved.
                console.error("Error updating equipment last maintenance date:", equipmentUpdateError);
                showAppNotification('Reporte guardado, pero no se pudo actualizar la fecha del equipo.', 'warning');
            }
        }
        
        showAppNotification('Reporte guardado exitosamente.', 'success');
        reportFormModal.style.display = 'none';
        
        // Refresh data
        await Promise.all([fetchReports(), fetchEquipment()]);
        
        // Re-render relevant tables
        if (currentUser.role === 'worker') {
            renderMyReportsTable();
        }
        renderAdminReportsTable(); // Always render admin tables in case an admin is logged in
        renderAdminScheduleTable();
        
    } catch (error: any) {
        console.error("Error saving report:", error);
        showAppNotification(`Error al guardar el reporte: ${error.message}`, 'error');
    } finally {
        hideLoader();
    }
}

function openCameraScanModal() {
    if (!qrVideoElement || !cameraScanModal || !qrHiddenCanvasElement) return;

    cameraScanModal.style.display = 'flex';
    cameraScanFeedback.textContent = 'Apuntando a la cámara...';
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            currentCameraStream = stream;
            qrVideoElement.srcObject = stream;
            qrVideoElement.setAttribute("playsinline", "true"); // required for iOS
            qrVideoElement.play();
            qrScanFrameId = requestAnimationFrame(tick);
        })
        .catch(err => {
            console.error("Error accessing camera:", err);
            cameraScanFeedback.textContent = 'Error al acceder a la cámara.';
            showAppNotification('No se pudo acceder a la cámara. Verifique los permisos.', 'error');
            closeCameraScanModal();
        });

    function tick() {
        if (qrVideoElement.readyState === qrVideoElement.HAVE_ENOUGH_DATA) {
            cameraScanFeedback.textContent = 'Buscando código QR...';
            const canvas = qrHiddenCanvasElement;
            const ctx = canvas.getContext('2d');
            canvas.height = qrVideoElement.videoHeight;
            canvas.width = qrVideoElement.videoWidth;
            if(!ctx) return;
            ctx.drawImage(qrVideoElement, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                cameraScanFeedback.textContent = '¡Código QR encontrado!';
                closeCameraScanModal();
                handleQrCodeResult(code.data);
                return; // Stop the loop
            }
        }
        qrScanFrameId = requestAnimationFrame(tick);
    }
}

function closeCameraScanModal() {
    if (currentCameraStream) {
        currentCameraStream.getTracks().forEach(track => track.stop());
        currentCameraStream = null;
    }
    if (qrScanFrameId) {
        cancelAnimationFrame(qrScanFrameId);
        qrScanFrameId = null;
    }
    if (cameraScanModal) {
        cameraScanModal.style.display = 'none';
    }
    if(qrVideoElement) qrVideoElement.srcObject = null;
}


function handleQrFileSelect() { 
    if (!qrFileInput.files || qrFileInput.files.length === 0) return;
    const file = qrFileInput.files[0];
    const reader = new FileReader();

    reader.onload = e => {
        const image = new Image();
        image.onload = () => {
            const canvas = qrHiddenCanvasElement;
            const ctx = canvas.getContext('2d');
            if(!ctx) return;
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0, image.width, image.height);
            const imageData = ctx.getImageData(0, 0, image.width, image.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
                handleQrCodeResult(code.data);
            } else {
                showAppNotification('No se encontró un código QR en la imagen.', 'warning');
            }
        };
        image.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    qrFileInput.value = ''; // Reset for next selection
}

function handleQrCodeResult(data: string) {
    try {
        const parsed = JSON.parse(data);
        if(parsed.equipmentId) {
            const equipment = equipmentList.find(e => e.id === parsed.equipmentId);
            if(equipment) {
                showAppNotification(`Equipo "${equipment.model}" encontrado.`, 'success');
                openReportFormModal(equipment);
            } else {
                showAppNotification('Equipo no encontrado en la base de datos local.', 'error');
            }
        } else {
             showAppNotification('Código QR no válido para esta aplicación.', 'warning');
        }
    } catch (error) {
        showAppNotification('El formato del código QR es incorrecto.', 'error');
        console.error("Error parsing QR code data:", error);
    }
}

async function setupSession(user: User) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    loginScreen.style.display = 'none';
    appScreen.style.display = 'block';
    bottomNav.style.display = 'flex';
    
    currentUserDisplay.textContent = `Usuario: ${user.name || user.username}`;
    
    if(changePinActionButton) {
      changePinActionButton.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
    }

    populateBottomNav(user.role);

    const firstNavItem = bottomNav.querySelector('.nav-item') as HTMLButtonElement | null;
    if (firstNavItem) {
        firstNavItem.click();
    }
}

function checkSession() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        showLoader("Reanudando sesión...");
        const user: User = JSON.parse(storedUser);
        const validUser = users.find(u => u.id === user.id);
        if (validUser && validUser.isActive) {
            console.log("Resuming session for:", validUser.name);
            setupSession(validUser);
        } else {
            sessionStorage.removeItem('currentUser');
        }
    }
}

async function handleDeleteReport(reportId: string) {
    showLoader("Eliminando reporte...");
    const { error } = await supabase.from(TABLE_REPORTS).delete().eq('id', reportId);
    hideLoader();

    if (error) {
        showAppNotification(`Error al eliminar el reporte: ${error.message}`, 'error');
        console.error("Error deleting report:", error);
    } else {
        showAppNotification("Reporte eliminado exitosamente.", 'success');
        await fetchReports();
        renderAdminReportsTable();
    }
}

/**
 * Main application initialization function.
 */
async function init() {
    console.log("Attaching event listeners...");
    
    // Login/Logout & Session
    loginForm?.addEventListener('submit', handleLogin);
    logoutButton?.addEventListener('click', handleLogout);
    adminPinLoginButton?.addEventListener('click', openAdminPinModal);
    adminPinForm?.addEventListener('submit', handleAdminPinSubmit);
    closeAdminPinModalButton?.addEventListener('click', () => adminPinModal.style.display = 'none');

    // Global Actions
    toggleFullscreenButton?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.warn(err));
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    });

    // Worker Actions
    scanQrCameraButton?.addEventListener('click', openCameraScanModal);
    scanQrFromFileButton?.addEventListener('click', () => qrFileInput.click());
    qrFileInput?.addEventListener('change', handleQrFileSelect);
    createManualReportButton?.addEventListener('click', () => openReportFormModal());
    cancelCameraScanButton?.addEventListener('click', closeCameraScanModal);
    closeCameraScanModalButton?.addEventListener('click', closeCameraScanModal);

    // Report Form & Modals
    maintenanceReportForm?.addEventListener('submit', handleMaintenanceFormSubmit);
    closeReportFormModalButton?.addEventListener('click', () => reportFormModal.style.display = 'none');
    cancelReportButton?.addEventListener('click', () => reportFormModal.style.display = 'none');

    // Signature Modal
    openSignatureModalButton?.addEventListener('click', openSignatureModal);
    closeSignatureModalButton?.addEventListener('click', () => signatureModal.style.display = 'none');
    saveSignatureButton?.addEventListener('click', handleSaveSignature);
    clearSignatureButton?.addEventListener('click', () => signaturePad?.clear());

    // View Report Modal
    closeViewReportDetailsModalButton?.addEventListener('click', () => viewReportDetailsModal.style.display = 'none');
    closeViewReportButton?.addEventListener('click', () => viewReportDetailsModal.style.display = 'none');

    // Admin Reports
    deleteAllReportsButton?.addEventListener('click', async () => {
        const confirmed = await showConfirmationModal(
            '¿Está ABSOLUTAMENTE SEGURO de que desea eliminar TODOS los reportes? Esta acción es irreversible y borrará toda la historia de mantenimientos.',
            'Sí, eliminar todo'
        );
        if (confirmed) {
            showLoader("Eliminando TODOS los reportes...");
            const { error } = await supabase.from(TABLE_REPORTS).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            hideLoader();
            if (error) {
                showAppNotification('Error al eliminar reportes.', 'error');
            } else {
                showAppNotification('Todos los reportes han sido eliminados.', 'success');
                await fetchReports();
                renderAdminReportsTable();
            }
        }
    });

    // Filtering & Searching Listeners
    [filterReportDateStart, filterReportDateEnd, filterReportCity, filterReportCompany, filterReportServiceType, filterReportTechnician].forEach(el => {
        el?.addEventListener('change', renderAdminReportsTable);
    });
    adminReportsSearchInput?.addEventListener('input', () => { tableSearchTerms.adminReports = adminReportsSearchInput.value; renderAdminReportsTable(); });
    adminReportsSearchClearButton?.addEventListener('click', () => { adminReportsSearchInput.value = ''; tableSearchTerms.adminReports = ''; renderAdminReportsTable(); });

    myReportsSearchInput?.addEventListener('input', () => { tableSearchTerms.myReports = myReportsSearchInput.value; renderMyReportsTable(); });
    myReportsSearchClearButton?.addEventListener('click', () => { myReportsSearchInput.value = ''; tableSearchTerms.myReports = ''; renderMyReportsTable(); });
    
    adminEquipmentSearchInput?.addEventListener('input', () => { tableSearchTerms.adminEquipment = adminEquipmentSearchInput.value; renderAdminEquipmentTable(); });
    adminEquipmentSearchClearButton?.addEventListener('click', () => { adminEquipmentSearchInput.value = ''; tableSearchTerms.adminEquipment = ''; renderAdminEquipmentTable(); });


    // Management Section
    addEquipmentButton?.addEventListener('click', () => openEntityFormModal('equipment'));
    addCityButton?.addEventListener('click', () => openEntityFormModal('city'));
    addCompanyButton?.addEventListener('click', () => openEntityFormModal('company'));
    addDependencyButton?.addEventListener('click', () => openEntityFormModal('dependency'));
    addEmployeeButton?.addEventListener('click', () => openEntityFormModal('employee'));
    
    tabLinks.forEach(link => link.addEventListener('click', (e) => handleTabClick(e as MouseEvent)));
    
    // Entity Form
    entityForm?.addEventListener('submit', handleEntityFormSubmit);
    closeEntityFormModalButton?.addEventListener('click', () => entityFormModal.style.display = 'none');
    cancelEntityButton?.addEventListener('click', () => entityFormModal.style.display = 'none');
    
    // Change Password (Admin)
    changePinActionButton?.addEventListener('click', () => { changePinForm.reset(); changePinError.textContent = ''; changePinModal.style.display = 'flex'; });
    changePinForm?.addEventListener('submit', handleChangePinSubmit);
    closeChangePinModalButton?.addEventListener('click', () => changePinModal.style.display = 'none');
    cancelChangePinButton?.addEventListener('click', () => changePinModal.style.display = 'none');
    
    // Image Preview Modal
    closeImagePreviewModalButton?.addEventListener('click', () => imagePreviewModal.style.display = 'none');


    console.log("UI is now responsive.");

    try {
        await loadInitialData();
        checkSession(); // Check for existing session after data is loaded
    } catch (error) {
        console.error("Initialization failed during data load:", error);
        showAppNotification('Falló la carga de datos de la aplicación.', 'error');
    } finally {
        hideLoader();
        console.log("Initialization complete.");
    }
}


// Start the application once the DOM is ready.
document.addEventListener('DOMContentLoaded', init);