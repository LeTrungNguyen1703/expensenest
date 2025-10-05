import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe', description: 'Unique username' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongP@ssw0rd', description: 'Password (min 6 characters)', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name of the user', nullable: true })
  @IsOptional()
  @IsString()
  full_name?: string;
}
