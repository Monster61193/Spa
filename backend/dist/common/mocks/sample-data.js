"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications_list = exports.audit_entries = exports.commissions_log = exports.points_history = exports.promotions_catalog = exports.services_overrides = exports.services_catalog = exports.points_summary = exports.promotions_board = exports.inventory_snapshot = exports.appointments_catalog = exports.branches = void 0;
exports.branches = [
    {
        id: "branch-principal",
        nombre: "Principal",
        zonaHoraria: "America/Mexico_City",
    },
    { id: "branch-norte", nombre: "Norte", zonaHoraria: "America/Mexico_City" },
];
exports.appointments_catalog = {
    "branch-principal": [
        {
            id: "a-1",
            servicio: "Manicure premium",
            cliente: "Martina",
            fechaHora: new Date("2025-10-02T11:00:00Z"),
            estado: "pendiente",
        },
        {
            id: "a-2",
            servicio: "Facial hidratante",
            cliente: "Lucía",
            fechaHora: new Date("2025-10-03T14:30:00Z"),
            estado: "confirmada",
        },
    ],
    "branch-norte": [
        {
            id: "a-12",
            servicio: "Pedicure spa",
            cliente: "Daniel",
            fechaHora: new Date("2025-10-05T10:00:00Z"),
            estado: "pendiente",
        },
    ],
};
exports.inventory_snapshot = {
    "branch-principal": [
        { material: "Esponjas termales", stockActual: 56, stockMinimo: 10 },
        { material: "Gel uñas", stockActual: 34, stockMinimo: 15 },
    ],
    "branch-norte": [
        { material: "Mascarilla arcilla", stockActual: 18, stockMinimo: 20 },
    ],
};
exports.promotions_board = {
    "branch-principal": [
        { id: "promo-1", nombre: "Lunes zen", descuento: 12, vigente: true },
    ],
    "branch-norte": [
        { id: "promo-2", nombre: "Norte VIP", descuento: 15, vigente: true },
    ],
};
exports.points_summary = {
    "branch-principal": [{ cliente: "Martina", puntos: 350 }],
    "branch-norte": [{ cliente: "Daniel", puntos: 120 }],
};
exports.services_catalog = [
    {
        id: "serv-1",
        nombre: "Manicure premium",
        precioBase: 420,
        duracionMinutos: 60,
    },
    {
        id: "serv-2",
        nombre: "Facial hidratante",
        precioBase: 780,
        duracionMinutos: 75,
    },
];
exports.services_overrides = [
    {
        servicioId: "serv-1",
        sucursalId: "branch-norte",
        precio: 450,
        duracionMinutos: 60,
    },
    {
        servicioId: "serv-2",
        sucursalId: "branch-principal",
        precio: 760,
        duracionMinutos: 70,
    },
];
exports.promotions_catalog = [
    { id: "promo-1", nombre: "Lunes zen", descuento: 12, vigente: true },
    { id: "promo-2", nombre: "Norte VIP", descuento: 15, vigente: true },
];
exports.points_history = {
    "branch-principal": [
        { id: "m-1", tipo: "earn", cantidad: 120, fecha: new Date() },
    ],
    "branch-norte": [
        { id: "m-2", tipo: "redeem", cantidad: 40, fecha: new Date() },
    ],
};
exports.commissions_log = {
    "branch-principal": [{ id: "c-1", empleado: "Lorena", monto: 320 }],
};
exports.audit_entries = [
    {
        entidad: "cita",
        accion: "creada",
        descripcion: "Cita generada desde el portal",
        sucursalId: "branch-principal",
    },
];
exports.notifications_list = {
    "branch-principal": [
        {
            id: "n-1",
            tipo: "recordatorio",
            mensaje: "Recordatorio de cita para Martina",
        },
    ],
};
