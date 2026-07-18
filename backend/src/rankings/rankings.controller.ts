import { Controller, Get, UseGuards } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  getRankings() {
    return this.rankingsService.getRankings();
  }
}
