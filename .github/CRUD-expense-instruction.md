# Sample Prompt for Creating Complete CRUD Module

## Core Requirements Summary

### 1. **Authentication & Security**
- ✅ All endpoints must be protected with `@UseGuards(JwtAuthGuard)`
- ✅ **NEVER take userId from URL parameter** - always extract from JWT token: `req.user.userId`
- ✅ Verify ownership for update/delete operations
- ✅ Add `@ApiBearerAuth('access-token')` to all protected endpoints

### 2. **Response Type Classes (NOT Interfaces)**
- ✅ Create Response class with `@Expose()` and `@ApiProperty()` decorators (DO NOT use interface for Response)
- ✅ Use `| null` instead of `?:` optional for nullable database fields
- ✅ Pattern:
```typescript
export class EntityResponse {
  @ApiProperty()
  @Expose()
  field_name: type;

  @ApiProperty({ nullable: true })
  @Expose()
  nullable_field: type | null;
}
```

### 3. **DTO Structure**
- ✅ CreateDto: Full validation with `class-validator` decorators
- ✅ Complete Swagger decorators: `@ApiProperty()`, `@ApiPropertyOptional()`
- ✅ UpdateDto: Use `PartialType(CreateDto)` from `@nestjs/mapped-types`
- ✅ Add separate DTOs for special operations (e.g., UpdateProgressDto, UpdateBalanceDto)

### 4. **Service Layer**
- ✅ **Always receive userId from JWT**, not from DTO or URL
- ✅ Signature pattern: `async create(createDto: CreateDto, userId: number): Promise<EntityResponse>`
- ✅ **Use object destructuring in create method** to handle special fields cleanly:
```typescript
// ✅ PREFER: Clean approach using destructuring
async create(createDto: CreateDto, userId: number): Promise<EntityResponse> {
  const { dateField, specialField, ...otherFields } = createDto;
  
  return await this.prisma.entities.create({
    data: {
      user_id: userId,
      ...otherFields,  // Spread all regular fields
      dateField: new Date(dateField),  // Handle date conversion
      specialField: specialField ?? defaultValue,  // Handle defaults
    },
  });
}
```
- ✅ **DO NOT use verbose select statements** - Prisma returns all fields by default which matches your Response class:
```typescript
// ❌ AVOID: Verbose select with all fields listed
return await this.prisma.entities.findMany({
  select: {
    field1: true,
    field2: true,
    field3: true,
    // ... 15 more fields
  }
});

// ✅ PREFER: Let Prisma return all fields (matches Response class)
return await this.prisma.entities.findMany({
  where: { user_id: userId },
  orderBy: { created_at: 'desc' }
});
```
- ✅ **Only use select when**:
  - Fetching data for ownership verification (only need user_id)
  - Excluding sensitive fields (like password_hash)
  - Returning partial data in delete operations
```typescript
// ✅ GOOD: Select only needed fields for verification
const existing = await this.prisma.entity.findUnique({
  where: { id },
  select: { user_id: true, other_needed_field: true }
});
```
- ✅ Verify ownership before update/delete:
```typescript
const existing = await this.prisma.entity.findUnique({
  where: { id },
  select: { user_id: true }
});
if (!existing) throw new NotFoundException();
if (existing.user_id !== userId) throw new BadRequestException('No permission');
```
- ✅ **Use object destructuring and spread operator in update method** to avoid verbose field-by-field checks:
```typescript
// ❌ AVOID: Verbose approach
const dataToUpdate: any = {};
if (dto.field1 !== undefined) dataToUpdate.field1 = dto.field1;
if (dto.field2 !== undefined) dataToUpdate.field2 = dto.field2;
// ... repeat for every field

// ✅ PREFER: Clean approach using destructuring
const { specialField1, specialField2, ...otherUpdates } = updateDto;
const dataToUpdate: any = {
  ...otherUpdates,  // Spread all other fields automatically
  updated_at: new Date(),
};

// Handle special fields separately (dates, calculations, etc.)
if (specialField1 !== undefined) {
  dataToUpdate.specialField1 = new Date(specialField1);
}

// Return without verbose select
return await this.prisma.entity.update({
  where: { id },
  data: dataToUpdate,
});
```
- ✅ Error handling with `PrismaClientKnownRequestError`:
  - P2002: Unique constraint violation
  - P2003: Foreign key constraint violation
  - P2025: Record not found
- ✅ Implement methods:
  - `create(dto, userId)` - auto-assign userId with destructuring
  - `findAll()` - admin view (no select needed)
  - `findOne(id)` - single record (no select needed)
  - `findByUserId(userId)` - user's own records (no select needed)
  - `update(id, dto, userId)` - with ownership check and clean spread syntax (no select needed)
  - `remove(id, userId)` - with ownership check (select only needed fields for response)
  - Additional methods as needed (findByStatus, updateProgress, etc.)

### 5. **Controller Layer**
- ✅ Extract userId from JWT: `@Request() req` → `req.user.userId`
- ✅ Endpoint pattern:
```typescript
@Post()
@ApiBearerAuth('access-token')
@ApiOperation({ summary: 'Create new entity' })
@ApiResponse({ status: 201, type: EntityResponse })
async create(@Body() dto: CreateDto, @Request() req): Promise<EntityResponse> {
  return this.service.create(dto, req.user.userId);
}

@Get('my-entities')  // NOT /user/:userId
@ApiBearerAuth('access-token')
async findMine(@Request() req): Promise<EntityResponse[]> {
  return this.service.findByUserId(req.user.userId);
}
```
- ✅ Use `ParseIntPipe` for ID parameters
- ✅ Proper HTTP status codes: `@HttpCode(HttpStatus.CREATED)`, etc.
- ✅ Full Swagger documentation with:
  - `@ApiTags('entity-name')`
  - `@ApiOperation({ summary: '...' })`
  - `@ApiResponse({ status: XXX, type: EntityResponse })`
  - `@ApiParam()` for path params
  - `@ApiBody()` for request body

### 6. **Module Configuration**
- ✅ Export service: `exports: [EntityService]`
- ✅ Import PrismaModule if needed

### 7. **Swagger Setup (main.ts)**
- ✅ Add new tag to DocumentBuilder:
```typescript
.addTag('entity-name', 'Entity management endpoints')
```
- ✅ Configure sorting: `tagsSorter: 'alpha'`, `operationsSorter: 'alpha'`

### 8. **Type Safety**
- ✅ Use Prisma enums from `@prisma/client`
- ✅ Validate enums with `@IsEnum(enum_name)`
- ✅ Proper null handling: `field ?? null` or `field ?? defaultValue`
- ✅ Clear return types for all async methods

### 9. **Best Practices**
- ✅ Sorting: `orderBy` in findMany queries
- ✅ Select specific fields instead of returning entire record
- ✅ Auto-update `updated_at` field when updating
- ✅ Implement soft delete if `is_active` field exists
- ✅ Meaningful error messages
- ✅ Try-catch with proper error handling

### 10. **Security Checklist**
- ❌ NEVER: `@Get('user/:userId')` - Can be exploited
- ✅ ALWAYS: `@Get('my-entities')` + `req.user.userId`
- ✅ ALWAYS: Verify ownership before modifying data
- ✅ ALWAYS: Extract userId from JWT token, not from request body/params

## Example Prompt Template

```
Create complete CRUD for [entity_name] based on the Prisma schema:

Requirements:
1. Extract userId from JWT token (req.user.userId), NOT from URL parameters
2. Use Response class (not interface) with @Expose() and @ApiProperty() decorators
3. Implement ownership verification for update/delete operations
4. Full Swagger documentation
5. All endpoints protected by JwtAuthGuard
6. Follow the pattern from wallets/categories/savings-goals modules

Key endpoints:
- POST /[entity-name] - Create (userId from JWT)
- GET /[entity-name] - Get all (admin)
- GET /[entity-name]/my-[entities] - Get user's own (userId from JWT)
- GET /[entity-name]/:id - Get by ID
- PATCH /[entity-name]/:id - Update (with ownership check)
- DELETE /[entity-name]/:id - Delete (with ownership check)

Additional endpoints as needed based on schema relationships.
```

## File Structure
```
src/
  [entity-name]/
    [entity-name].controller.ts
    [entity-name].service.ts
    [entity-name].module.ts
    dto/
      create-[entity-name].dto.ts
      update-[entity-name].dto.ts
    interfaces/
      [entity-name].interface.ts  // Contains both Interface and Response class
```

## Common Patterns

### Pattern 1: User-specific data access
```typescript
// Service
async findByUserId(userId: number): Promise<EntityResponse[]> {
  return this.prisma.entities.findMany({
    where: { user_id: userId },
    select: { /* all fields */ },
    orderBy: { created_at: 'desc' }
  });
}

// Controller
@Get('my-entities')
@ApiBearerAuth('access-token')
async findMine(@Request() req): Promise<EntityResponse[]> {
  return this.service.findByUserId(req.user.userId);
}
```

### Pattern 2: Ownership verification
```typescript
// Service
async update(id: number, dto: UpdateDto, userId: number): Promise<EntityResponse> {
  const existing = await this.prisma.entity.findUnique({
    where: { entity_id: id },
    select: { user_id: true }
  });

  if (!existing) {
    throw new NotFoundException(`Entity with ID ${id} not found`);
  }

  if (existing.user_id !== userId) {
    throw new BadRequestException('You do not have permission to update this entity');
  }

  // Proceed with update...
}
```

### Pattern 3: Auto-assign userId on create
```typescript
// Service
async create(dto: CreateDto, userId: number): Promise<EntityResponse> {
  return await this.prisma.entities.create({
    data: {
      user_id: userId,  // From JWT, not from DTO
      ...dto,
      // set defaults
    },
    select: { /* all fields */ }
  });
}
```

### Pattern 4: Response type definition
```typescript
// interfaces/entity.interface.ts
export interface Entity {
  entity_id: number;
  user_id: number;
  name: string;
  nullable_field: string | null;
  created_at: Date | null;
}

export class EntityResponse {
  @ApiProperty()
  @Expose()
  entity_id: number;

  @ApiProperty()
  @Expose()
  user_id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ nullable: true })
  @Expose()
  nullable_field: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  created_at: Date | null;
}
```

---

## ❌ Common Mistakes to Avoid

1. ❌ Using interface instead of class for Response types
2. ❌ Taking userId from URL params or request body
3. ❌ Not verifying ownership before update/delete
4. ❌ Using `?:` optional instead of `| null` for nullable database fields
5. ❌ Forgetting to add @ApiBearerAuth decorator
6. ❌ Not exporting service from module
7. ❌ Missing Swagger documentation
8. ❌ Not handling Prisma errors properly
9. ❌ Returning full entity with sensitive data instead of using select
10. ❌ Not adding new tag to main.ts Swagger configuration

---

## ✅ Validation Checklist

- [ ] Response class (not interface) with @Expose() and @ApiProperty()
- [ ] All endpoints use @UseGuards(JwtAuthGuard)
- [ ] userId extracted from req.user.userId (never from URL/body)
- [ ] Ownership verification on update/delete
- [ ] Full Swagger documentation (@ApiTags, @ApiOperation, @ApiResponse)
- [ ] Proper error handling (404, 400, 409)
- [ ] Service exported from module
- [ ] Tag added to main.ts Swagger config
- [ ] No compilation errors
- [ ] DTO validation with class-validator decorators
- [ ] Nullable fields use `| null` not `?:`
