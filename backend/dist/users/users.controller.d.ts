import { UsersService } from "./users.service";
export declare class UsersController {
    private readonly users_service;
    constructor(users_service: UsersService);
    listar_clientes(): Promise<{
        items: {
            id: string;
            nombre: string;
            email: string;
        }[];
    }>;
}
