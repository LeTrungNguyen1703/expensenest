import { PartialType } from '@nestjs/mapped-types';
import { CreateSavingsContributionDto } from './create-savings-contribution.dto';

export class UpdateSavingsContributionDto extends PartialType(CreateSavingsContributionDto) {}
