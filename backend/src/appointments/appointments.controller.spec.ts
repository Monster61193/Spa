import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";

// Mock del servicio (Simulacro)
const mock_appointments_service = {
  listar: jest.fn(),
  agendar: jest.fn(),
  cerrar: jest.fn(),
};

/**
 * Suite de Pruebas: AppointmentsController.
 * Verifica que la capa HTTP valide y transforme correctamente los datos
 * antes de llamar al servicio.
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

  describe("crear (Validación Zod Multi-servicio)", () => {
    /**
     * Caso de Éxito: Payload válido con array de servicios.
     */
    it("debe aceptar un payload con array de servicios_ids", async () => {
      // ARRANGE: Datos válidos según el nuevo esquema
      const payload_valido = {
        usuario_id: "user-1",
        servicios_ids: ["serv-1", "serv-2"], // Array con múltiples servicios
        fecha_hora: "2025-10-25T10:00:00Z",
      };

      const request_mock = { branchId: "branch-principal" } as any;

      // ACT: Llamada al controlador
      await controller.crear(payload_valido, request_mock);

      // ASSERT: Verificar que el servicio recibió los datos correctos
      expect(service.agendar).toHaveBeenCalledWith(
        payload_valido,
        "branch-principal"
      );
    });

    /**
     * Caso de Error: Array vacío.
     */
    it("debe rechazar si servicios_ids está vacío", async () => {
      const payload_invalido = {
        usuario_id: "user-1",
        servicios_ids: [], // Error: min(1)
        fecha_hora: "2025-10-25T10:00:00Z",
      };
      const request_mock = { branchId: "branch-principal" } as any;

      // ASSERT: Zod debe lanzar excepción
      await expect(
        controller.crear(payload_invalido, request_mock)
      ).rejects.toThrow();
    });
  });
});
