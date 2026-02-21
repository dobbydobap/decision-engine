# Decision Intelligence Platform (Backend)

## Problem Statement
Making complex, multi-variable decisions (e.g., "Which tech stack should I use?" or "Should I rent or buy?") is often driven by cognitive bias, emotion, or flawed mental math. This project provides a programmatic, mathematically sound backend engine to remove the guesswork. By breaking dilemmas down into weighted criteria and scored options, the API calculates the optimal choice objectively.

---

## System Architecture

The application follows a strict 3-Layer Architecture (Controller-Service-Repository) to separate concerns and ensure maintainability.

* **Client** makes HTTP requests via REST.
* **Router** maps endpoints to specific controllers.
* **Middleware** (Auth/CORS/Helmet) intercepts requests to validate JWTs and secure headers.
* **Controllers** act as traffic cops—extracting parameters, validating payloads (via Zod), and handling HTTP responses.
* **Services** contain pure business logic and the mathematical evaluation engine.
* **Prisma (ORM)** acts as the repository layer, communicating safely with the **PostgreSQL** database.

---

## Database Schema

The database relies on a highly relational PostgreSQL structure. 

* **User:** Contains authenticated credentials.
* **Decision:** The root of the problem (e.g., "Rent vs. Buy"), strictly tied to a `User`.
* **Option:** The available choices, tied to a `Decision`.
* **Criterion:** The measuring sticks, including a `weight` (1-5), tied to a `Decision`.
* **Score:** The intersection table. It links one `Option` and one `Criterion` with a numerical value. 

**Key Database Features:**
* **Cascading Deletes:** Deleting a Decision automatically wipes all orphaned Options, Criteria, and Scores.
* **Composite Unique Constraints:** A database-level lock (`@@unique([optionId, criterionId])`) ensures an Option can only be scored once per Criterion.

---

## API Design

The API uses nested RESTful routing to maintain clear resource hierarchy.

### Authentication
* `POST /api/auth/register` - Create a new user (bcrypt password hashing).
* `POST /api/auth/login` - Authenticate and receive a JWT.

### Core Engine (Protected by JWT)
* `POST /api/decisions` - Create a new decision.
* `GET /api/decisions` - Fetch all decisions belonging to the authenticated user.
* `GET /api/decisions/:id` - Fetch a single decision with all nested relationships.
* `DELETE /api/decisions/:id` - Securely trigger a cascading delete of a decision.

### Matrix Data (Nested Routes)
* `POST /api/decisions/:decisionId/options` - Add a choice.
* `POST /api/decisions/:decisionId/criteria` - Add a weighted metric.
* `POST /api/decisions/:decisionId/scores` - Assign a value to an Option/Criterion pair.

### Intelligence
* `GET /api/decisions/:decisionId/evaluate` - Triggers the calculation engine to multiply scores by weights, sum the totals, and return a ranked breakdown of the winner.

---

## Tradeoffs

1.  **REST vs. GraphQL:** Chose REST for simplicity and strict resource routing. However, since the Evaluation Engine requires deeply nested data, a custom `/evaluate` endpoint was necessary rather than relying purely on standard CRUD patterns.
2.  **Synchronous Calculation:** The decision evaluation currently runs synchronously on the main thread during the HTTP request. This is highly performant for standard personal decisions, but for massive enterprise matrices with thousands of criteria, it would need to be offloaded to a background worker queue (like Redis/BullMQ).

---

## Challenges Faced

1.  **Data Consistency:** Ensuring users couldn't accidentally score the same option twice on the same criterion. Solved by implementing Prisma composite unique constraints and catching specific `P2002` database errors in the controller to return clean 400 Bad Request messages.
2.  **Cross-User Data Leaks:** Securing the nested routes. It wasn't enough to check if a user was logged in; the API had to query the database to verify the `userId` attached to the specific `Decision` matched the token *before* allowing them to add options or calculate results.

---

## Performance Considerations

* **Stateless Auth:** JWTs are used instead of database-backed sessions, reducing database query load on every protected route.
* **O(1) Lookups in the Engine:** The evaluation algorithm maps Criteria weights to a dictionary (`Record<string, number>`) before running the calculation loop, turning what would be a slow $O(N)$ array search into a lightning-fast $O(1)$ lookup.

---

## Future Improvements

* **Sensitivity Analysis:** An endpoint that tells the user, *"Option B would have won if you cared slightly more about Cost."*
* **Collaborative Decisions:** Updating the schema so multiple users can vote on scores for shared decisions.
* **Pagination:** Adding `limit` and `offset` queries to the `GET /api/decisions` route for power users.