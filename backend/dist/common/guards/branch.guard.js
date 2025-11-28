"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchGuard = void 0;
const common_1 = require("@nestjs/common");
let BranchGuard = class BranchGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const branch_id = request.headers['x-branch-id'];
        if (!branch_id) {
            throw new common_1.UnauthorizedException('Cabecera X-Branch-Id es obligatoria');
        }
        request.branchId = branch_id;
        return true;
    }
};
exports.BranchGuard = BranchGuard;
exports.BranchGuard = BranchGuard = __decorate([
    (0, common_1.Injectable)()
], BranchGuard);
