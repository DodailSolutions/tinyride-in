import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParentOwnershipGuard } from '../../common/guards/parent-ownership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateChildDto, CreateGuardianDto } from './dto/parents.dto';
import { ParentsService } from './parents.service';

@ApiTags('Parents & Children')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('me')
  @Roles('parent', 'admin')
  @ApiOperation({ summary: "Get current parent profile, locations, and children" })
  @ApiResponse({ status: 200, description: 'Parent details retrieved successfully' })
  async getMe(@CurrentUser('userId') userId: string) {
    return this.parentsService.getMe(userId);
  }

  @Post('children')
  @Roles('parent', 'admin')
  @ApiOperation({ summary: 'Register a child under current parent' })
  @ApiResponse({ status: 201, description: 'Child registered successfully' })
  async createChild(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateChildDto,
  ) {
    return this.parentsService.createChild(userId, dto);
  }

  @Get('children')
  @Roles('parent', 'admin')
  @ApiOperation({ summary: 'List all children registered by current parent' })
  @ApiResponse({ status: 200, description: 'List of children' })
  async getChildren(@CurrentUser('userId') userId: string) {
    return this.parentsService.getChildren(userId);
  }

  @Get('children/:childId')
  @UseGuards(ParentOwnershipGuard)
  @Roles('parent', 'admin', 'operator')
  @ApiOperation({ summary: 'Get single child details with health notes and guardians' })
  @ApiResponse({ status: 200, description: 'Child profile details' })
  async getChild(
    @CurrentUser('userId') userId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
  ) {
    return this.parentsService.getChildById(userId, childId);
  }

  @Post('children/:childId/guardians')
  @UseGuards(ParentOwnershipGuard)
  @Roles('parent', 'admin')
  @ApiOperation({ summary: 'Add an authorized guardian for a child' })
  @ApiResponse({ status: 201, description: 'Guardian created and linked successfully' })
  async addGuardian(
    @CurrentUser('userId') userId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: CreateGuardianDto,
  ) {
    return this.parentsService.createGuardian(userId, childId, dto);
  }

  @Get('children/:childId/guardians')
  @UseGuards(ParentOwnershipGuard)
  @Roles('parent', 'admin', 'operator')
  @ApiOperation({ summary: 'List authorized guardians for a child' })
  @ApiResponse({ status: 200, description: 'Authorized guardians list' })
  async getGuardians(
    @CurrentUser('userId') userId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
  ) {
    return this.parentsService.getGuardians(userId, childId);
  }
}
