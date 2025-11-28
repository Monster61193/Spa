import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class BranchGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
