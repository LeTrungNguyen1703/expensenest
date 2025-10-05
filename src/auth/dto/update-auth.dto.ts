import {PartialType} from '@nestjs/mapped-types';
import {LoginRequest} from './create-auth.dto';

export class UpdateAuthDto extends PartialType(LoginRequest) {
}
