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
  });


  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();


    app = moduleFixture.createNestApplication();
    await app.init();
  });


  it('DELETE /api/tasks - удаляет все задачи', () => {
    return request(app.getHttpServer()).delete('/api/tasks');
  });


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
        expect(res.body.findings).toHaveLength(2);
        expect(res.body.findings.every((f: any) => f.findingId)).toBeTruthy();
      });
  });


  it('GET /api/tasks?file_path=... — возвращает исходный контракт + savedFindings', async () => {
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


    // 1. Создаём задачу
    await request(app.getHttpServer())
      .post('/api/tasks')
      .send(mockTask)
      .expect(201);


    // 2. Получаем задачу по file_path
    const res = await request(app.getHttpServer())
      .get(
        `/api/tasks?file_path=${encodeURIComponent(
          mockTask.file.path,
        )}`,
      )
      .expect(200);


    const task = res.body[0];


    // Дополнительные поля БД
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('filePath', mockTask.file.path);
    expect(task).toHaveProperty('fileName', mockTask.file.name);
    expect(task).toHaveProperty('createdAt');
    expect(task).toHaveProperty('updatedAt');


    // Исходный контракт создания
    expect(task.prompt_version).toBe(mockTask.prompt_version);
    expect(task.file).toEqual(mockTask.file);
    expect(task.summary).toEqual(mockTask.summary);
    expect(task.findings).toEqual(mockTask.findings);
    expect(task.improvements).toEqual(mockTask.improvements);
    expect(task.parentTagName).toBe(mockTask.parentTagName);
    expect(task.tagName).toBe(mockTask.tagName);


    // Сохранённые в БД findings
    expect(task.savedFindings).toHaveLength(2);
    expect(task.savedFindings[0]).toHaveProperty('id');
    expect(task.savedFindings[0]).toHaveProperty('findingId', 'F-002');
    expect(task.savedFindings[1]).toHaveProperty('findingId', 'F-003');
  });


  afterEach(async () => {
    await app.close();
  });
});