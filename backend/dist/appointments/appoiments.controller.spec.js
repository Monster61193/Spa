"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const appointments_controller_1 = require("./appointments.controller");
const appointments_service_1 = require("./appointments.service");
const mock_appointments_service = {
    listar: jest.fn(),
    agendar: jest.fn(),
    cerrar: jest.fn(),
};
describe("AppointmentsController", () => {
    let controller;
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [appointments_controller_1.AppointmentsController],
            providers: [
                { provide: appointments_service_1.AppointmentsService, useValue: mock_appointments_service },
            ],
        }).compile();
        controller = module.get(appointments_controller_1.AppointmentsController);
        service = module.get(appointments_service_1.AppointmentsService);
    });
    describe("crear (Validación Zod)", () => {
        it("debe aceptar IDs no-UUID (como serv-1) correctamente", async () => {
            const payload_valido = {
                usuario_id: "user-admin-id",
                servicio_id: "serv-1",
                fecha_hora: "2025-10-25T10:00:00Z",
            };
            const request_mock = { branchId: "branch-principal" };
            await controller.crear(payload_valido, request_mock);
            expect(service.agendar).toHaveBeenCalledWith(payload_valido, "branch-principal");
        });
        it("debe rechazar fechas inválidas", async () => {
            const payload_invalido = {
                usuario_id: "user-1",
                servicio_id: "serv-1",
                fecha_hora: "esto-no-es-una-fecha",
            };
            const request_mock = { branchId: "branch-principal" };
            await expect(controller.crear(payload_invalido, request_mock)).rejects.toThrow();
        });
    });
});
