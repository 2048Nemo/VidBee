# API Patterns (oRPC)

Contract-first API development using oRPC.

## Overview

oRPC provides type-safe API development with:
- Contract definitions
- Type inference
- TanStack Query integration

## Contract Definition

Location: `apps/web/src/contract/`

```typescript
// apps/web/src/contract/user.ts
import { o } from '@orpc/contract'
import { z } from 'zod'

export const userContract = {
  getUser: o.route({
    method: 'GET',
    path: '/users/:id',
    input: z.object({
      id: z.string(),
    }),
    output: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    }),
  }),

  listUsers: o.route({
    method: 'GET',
    path: '/users',
    input: z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
    }),
    output: z.object({
      users: z.array(z.object({
        id: z.string(),
        name: z.string(),
      })),
      total: z.number(),
    }),
  }),

  createUser: o.route({
    method: 'POST',
    path: '/users',
    input: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    output: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
}
```

## Service Implementation

Location: `apps/web/src/service/`

```typescript
// apps/web/src/service/user.ts
import { createService } from '@/lib/orpc'
import { userContract } from '@/contract/user'
import { db } from '@myproject/db'

export const userService = createService(userContract, {
  getUser: async ({ id }) => {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) throw new Error('User not found')
    return user
  },

  listUsers: async ({ page = 1, limit = 10 }) => {
    const [users, total] = await Promise.all([
      db.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count(),
    ])
    return { users, total }
  },

  createUser: async (data) => {
    return db.user.create({ data })
  },
})
```

## Client Usage with TanStack Query

```tsx
// apps/web/src/components/UserList.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/service/user'

export function UserList() {
  const queryClient = useQueryClient()

  // Query
  const { data, isLoading } = useQuery(
    userService.listUsers.queryOptions({ page: 1, limit: 10 })
  )

  // Mutation
  const createUser = useMutation(userService.createUser.mutationOptions())

  const handleCreate = async () => {
    await createUser.mutateAsync({
      name: 'John',
      email: 'john@example.com',
    })
    // Invalidate and refetch
    queryClient.invalidateQueries({
      queryKey: userService.listUsers.queryKey()
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {data?.users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={handleCreate}>Create User</button>
    </div>
  )
}
```

## API Server (Backend)

Location: `apps/api/src/`

```typescript
// apps/api/src/routes/users.ts
import { Router } from 'express'
import { db } from '@myproject/db'

const router = Router()

router.get('/users/:id', async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.params.id },
  })
  res.json(user)
})

router.get('/users', async (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const users = await db.user.findMany({
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  })
  res.json({ users, total: await db.user.count() })
})

router.post('/users', async (req, res) => {
  const user = await db.user.create({
    data: req.body,
  })
  res.json(user)
})

export default router
```

```typescript
// apps/api/src/server.ts
import express from 'express'
import usersRouter from './routes/users'

const app = express()
app.use(express.json())
app.use('/api', usersRouter)

app.listen(3001, () => {
  console.log('API server running on port 3001')
})
```

## Error Handling

```typescript
// apps/web/src/lib/orpc/errors.ts
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500
  ) {
    super(message)
  }
}

export const errorHandler = (error: unknown) => {
  if (error instanceof APIError) {
    return {
      code: error.code,
      message: error.message,
    }
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  }
}
```

## Best Practices

1. **Contract First** - Define contracts before implementation
2. **Type Safety** - Leverage TypeScript inference
3. **Validation** - Use Zod for input validation
4. **Error Handling** - Consistent error responses
5. **Caching** - Use TanStack Query for caching
6. **Testing** - Test contracts and services separately
