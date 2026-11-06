import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from 'supertest/types.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env.DATABASE_URL,
          autoLoadEntities: true,
          synchronize: true, // в CI создаёт таблицы
        }),
      ],
    }).compile();
  })

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('DELETE /api/tasks - удаляет все задачи', () => {
    return request(app.getHttpServer()).delete('/api/tasks')
  })

  it('POST /api/tasks — создаёт задачу с мок-данными', () => {
    const mockTask = {
      prompt_version: 'ABSTRACT_CODE_REVIEW_LAYER_2026_10_19_18',
      file: {
        path: '../../projects/annenkov_tech/src/Components/Circle/Circle.tsx',
        name: 'Circle.tsx',
        language: 'typescript',
        assumed_role: 'UI Component',
        assumed_layer: 'Presentation Layer',
        responsibility: 'Rendering an interactive SVG circle...',
        context_confidence: 'high',
      },
      summary: {
        overall_quality: 'acceptable',
        critical_issues_found: false,
        review_confidence: 'high',
        needs_context: false,
        missing_context: ['GSAP requirements for the used library version'],
        notes: '...',
      },
      findings: [
        {
          id: 'F-002',
          title: 'Fixed delay synchronization for dot positioning',
          kind: 'architecture_question',
          category: 'performance',
          severity: 'low',
          confidence: 'medium',
          release_impact: 'backlog',
        },
        {
          id: 'F-003',
          title: 'Potential stale entries in dotPositionsRef cache',
          kind: 'conditional_risk',
          category: 'correctness',
          severity: 'low',
          confidence: 'medium',
          release_impact: 'backlog',
        },
      ],
      improvements: [],
      parentTagName: 'Components',
      tagName: 'Components_Circle',
    };

    return request(app.getHttpServer())
      .post('/api/tasks')
      .send(mockTask)
      .expect(201)
      .expect((res) => {
        expect(res.body.findingsSaved).toBe(2);
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
