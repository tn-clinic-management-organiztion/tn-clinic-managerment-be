import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { Icd10Service } from '../services/icd10.service';
import { CreateIcd10Dto } from 'src/modules/system/dto/icd10/create-icd10.dto';
import { FilterIcd10Dto } from 'src/modules/system/dto/icd10/filter-icd10.dto';
import { UpdateIcd10Dto } from 'src/modules/system/dto/icd10/update-icd10.dto';

@Controller('system/icd10')
export class Icd10Controller {
  constructor(private readonly icd10Service: Icd10Service) {}

  // 1. Tạo mới
  @Post()
  create(@Body() createIcd10Dto: CreateIcd10Dto) {
    return this.icd10Service.create(createIcd10Dto);
  }

  // 2. Lấy danh sách (Search + Pagination)
  // URL: GET /icd10?page=1&limit=10&search=Sốt
  @Get()
  findAll(@Query() query: FilterIcd10Dto) {
    return this.icd10Service.findAll(query);
  }

  // 3. Lấy danh sách con của 1 mã (Dùng cho Tree View)
  // URL: GET /icd10/A00-A09/children -> Trả về A00, A01, A02...
  @Get(':code/children')
  findChildren(@Param('code') code: string) {
    return this.icd10Service.findChildren(code);
  }

  // 4. Lấy chi tiết 1 mã
  // URL: GET /icd10/A00
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.icd10Service.findOne(code);
  }

  // 5. Cập nhật
  // URL: PATCH /icd10/A00
  @Patch(':code')
  update(@Param('code') code: string, @Body() updateIcd10Dto: UpdateIcd10Dto) {
    return this.icd10Service.update(code, updateIcd10Dto);
  }

  // 6. Xóa
  // URL: DELETE /icd10/A00
  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.icd10Service.remove(code);
  }
}