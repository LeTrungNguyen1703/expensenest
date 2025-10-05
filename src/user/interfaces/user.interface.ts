import {Expose} from "class-transformer";
import {ApiProperty} from "@nestjs/swagger";

export interface User {
    user_id: number;
    username: string;
    email: string;
    password_hash: string;
    full_name: string | null;
    created_at: Date | null;
    updated_at: Date | null;
    is_active: boolean | null;
}

export class UserResponse {
    @ApiProperty()
    @Expose()
    user_id: number;

    @ApiProperty()
    @Expose()
    username: string;

    @ApiProperty()
    @Expose()
    email: string;

    @ApiProperty({nullable: true})
    @Expose()
    full_name: string | null;

    @ApiProperty({nullable: true})
    @Expose()
    created_at: Date | null;

    @ApiProperty({nullable: true, required: false})
    @Expose()
    updated_at?: Date | null;

    @ApiProperty({nullable: true})
    @Expose()
    is_active: boolean | null;
}