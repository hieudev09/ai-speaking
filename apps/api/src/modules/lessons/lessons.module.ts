import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller.js';
import { LessonsService } from './lessons.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { CoursesModule } from '../courses/courses.module.js';

@Module({
  imports: [AuthModule, CoursesModule],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
