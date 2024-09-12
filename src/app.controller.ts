import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('hackathon/team26')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('all')
  batchJobs() {
    return this.appService.getAllJobs();
  }

  @Get(':id')
  getJobById(@Param('id') id: string) {
    return this.appService.getBatchJobById(id);
  }

  @Post('update')
  updateJobById(@Body() bodyDto: { id: string; }) {
    return this.appService.updateJobById(bodyDto);
  }
}

