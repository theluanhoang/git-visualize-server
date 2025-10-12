import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePracticeDTO } from './create-practice.dto';

export class UpdatePracticeDTO extends PartialType(CreatePracticeDTO) {
    @ApiPropertyOptional({
        description: 'Update practice title',
        example: 'Updated Git Basics Practice'
    })
    title?: string;

    @ApiPropertyOptional({
        description: 'Update practice scenario',
        example: 'Updated scenario description'
    })
    scenario?: string;

    @ApiPropertyOptional({
        description: 'Update practice difficulty',
        example: 3,
        minimum: 1,
        maximum: 5
    })
    difficulty?: number;

    @ApiPropertyOptional({
        description: 'Update estimated time',
        example: 20,
        minimum: 0
    })
    estimatedTime?: number;

    @ApiPropertyOptional({
        description: 'Update active status',
        example: false
    })
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Update practice order',
        example: 2,
        minimum: 0
    })
    order?: number;
}
