import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    description: 'Updated state for ticket',
    enum: ['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed'],
  })
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed'])
  state?: 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed';

  @ApiPropertyOptional({ description: 'Support agent profile UUID assigned' })
  @IsOptional()
  @IsUUID('4')
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Internal or resolution notes' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateTicketDto {
  @ApiProperty({
    description: 'Category of inquiry',
    enum: ['onboarding', 'booking', 'payment', 'safety', 'route', 'app_issue', 'other'],
  })
  @IsEnum(['onboarding', 'booking', 'payment', 'safety', 'route', 'app_issue', 'other'])
  category: string;

  @ApiProperty({ description: 'Ticket subject line' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({ description: 'Severity level', enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Initial message body' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
