import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";

// Mock del servicio de citas
const mock_appointments_service = {
  listar: jest.fn(),
  agendar: jest.fn(),
  cerrar: jest.fn(),
};

/**
 * Suite de pruebas para AppointmentsController.
 * Se enfoca en validar que el esquema Zod acepte los formatos de datos esperados.
 */
describe("AppointmentsController", () => {
  let controller: AppointmentsController;
  let service: typeof mock_appointments_service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        { provide: AppointmentsService, useValue: mock_appointments_service },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get(AppointmentsService);
  });

  describe("crear (Validación Zod)", () => {
    it("debe aceptar IDs no-UUID (como serv-1) correctamente", async () => {
      // 1. Payload con IDs cortos (Seeds)
      const payload_valido = {
        usuario_id: "user-admin-id", // ID corto
        servicio_id: "serv-1", // ID corto
        fecha_hora: "2025-10-25T10:00:00Z",
      };

      const request_mock = { branchId: "branch-principal" } as any;

      // 2. Ejecución
      await controller.crear(payload_valido, request_mock);

      // 3. Verificación
      // Si llega aquí sin lanzar error, la validación relajada funcionó.
      expect(service.agendar).toHaveBeenCalledWith(
        payload_valido,
        "branch-principal"
      );
    });

    it("debe rechazar fechas inválidas", async () => {
      const payload_invalido = {
        usuario_id: "user-1",
        servicio_id: "serv-1",
        fecha_hora: "esto-no-es-una-fecha",
      };
      const request_mock = { branchId: "branch-principal" } as any;

      // Esperamos que Zod lance un error al parsear la fecha
      await expect(
        controller.crear(payload_invalido, request_mock)
      ).rejects.toThrow();
    });
  });
});
