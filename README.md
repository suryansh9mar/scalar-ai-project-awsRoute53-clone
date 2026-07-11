# AWS Route53 Clone

## 1. Project Overview & Architecture

The **AWS Route53 Clone** is a full-stack web application designed to replicate the core management features and user interface of Amazon Web Services (AWS) Route 53. It provides a highly functional, scalable, and responsive interface for managing Domain Name System (DNS) configurations, hosted zones, and complex routing policies.

### Architecture Breakdown
The project operates on a modern **Client-Server model** and follows a clean monorepo structure separated into two distinct directories:
- **`frontend/` (Next.js & TypeScript)**: Built with Next.js and styled using the **AWS Cloudscape Design System**, the client provides a pixel-perfect emulation of the AWS Console experience. It communicates with the backend asynchronously using REST APIs.
- **`backend/` (FastAPI & Python)**: A high-performance Python backend powered by FastAPI. It handles business logic, validation, and data persistence using an **SQLite** database via the **SQLAlchemy** ORM.

Communication between the frontend and backend flows seamlessly over standard **REST APIs**, ensuring loose coupling, fast response times, and ease of future scalability.

---

## 2. Core & Advanced Features Checklist

### Core Features
- [x] **Hosted Zones Management**: Full CRUD (Create, Read, Update, Delete) capabilities. Includes real-time searching, filtering, and pagination for managing numerous zones.
- [x] **DNS Records Management**: Comprehensive CRUD operations for records inside hosted zones. Supports multiple record types: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, and `CAA`.
- [x] **AWS Console UX**: Built using Cloudscape to mirror the actual AWS console. Features include dense data tables, expandable detail sections, multi-select checkboxes, and responsive side navigation.

### Advanced Capabilities
- [x] **BIND Zone File Import**: Quickly import existing DNS configurations directly from standard BIND zone files.
- [x] **Zone Data Exporting**: Export your hosted zones and records to JSON or BIND formats for backups or migrations.
- [x] **Batch/Bulk Operations**: Perform actions across multiple DNS records simultaneously.
- [x] **Global Capabilities**: Integrated global keyboard shortcuts and advanced filtering systems for power users.

### Placeholders & Upcoming Features
- [ ] **Dashboard**: Centralized metrics and system status (Coming Soon).
- [ ] **Traffic Policies**: Visual traffic policy builder (Coming Soon).
- [ ] **Health Checks**: Endpoint monitoring and failover routing (Coming Soon).
- [ ] **Resolver & Profiles**: Advanced VPC DNS configuration management (Coming Soon).

---

## 3. Database Schema Design

The backend utilizes SQLite through SQLAlchemy with a straightforward relational schema. The two primary entities are `HostedZone` and `Record`.

### `HostedZone` Table
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID / String | Primary Key, Unique |
| `name` | String | Domain Name (e.g., example.com) |
| `caller_reference` | String | Unique identifier for creation request |
| `comment` | String | Optional description |
| `is_private` | Boolean | Public or Private hosted zone |
| `record_count` | Integer | Calculated field or cached count |
| `created_at` | DateTime | Timestamp of creation |

### `Record` Table
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID / String | Primary Key, Unique |
| **`zone_id`** | UUID / String | **Foreign Key (`HostedZone.id`)**, Cascade on Delete |
| `name` | String | Subdomain/Record Name |
| `type` | String | Record Type (A, CNAME, TXT, etc.) |
| `ttl` | Integer | Time to Live in seconds |
| `value` | String/Text | Routing destination(s) |
| `routing_policy` | String | e.g., Simple, Weighted, Latency |

---

## 4. API Endpoint Overview

The FastAPI backend exposes the following REST API endpoints for client consumption:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/zones` | Retrieve a paginated list of all hosted zones. |
| **POST** | `/api/zones` | Create a new hosted zone. |
| **GET** | `/api/zones/{zone_id}` | Retrieve details of a specific hosted zone. |
| **DELETE** | `/api/zones/{zone_id}` | Delete a hosted zone and its associated records. |
| **GET** | `/api/zones/{zone_id}/records` | Get all DNS records belonging to a hosted zone. |
| **POST** | `/api/zones/{zone_id}/records` | Create a new DNS record in a specific zone. |
| **PUT** | `/api/records/{record_id}` | Update an existing DNS record's details. |
| **DELETE** | `/api/records/{record_id}` | Delete a specific DNS record. |
| **POST** | `/api/zones/import` | Import zone configuration from a BIND file payload. |
| **GET** | `/api/zones/{zone_id}/export` | Export a hosted zone to JSON/BIND format. |

---

## 5. Local Setup & Installation Instructions

Follow these step-by-step instructions to get the application running locally on your machine.

### Prerequisites
- Python 3.9+
- Node.js 18+ & npm

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/aws-route53-clone.git
cd aws-route53-clone
```

### Step 2: Setup the FastAPI Backend
Open a terminal and navigate to the backend directory:
```bash
cd backend

# Create and activate a Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Launch the FastAPI application using Uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The backend API and interactive Swagger docs will now be running at `http://localhost:8000/docs`.

### Step 3: Setup the Next.js Frontend
Open a **new** terminal and navigate to the frontend directory:
```bash
cd frontend

# Install Node dependencies (including AWS Cloudscape packages)
npm install

# Create a local environment variables file
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

# Start the Next.js development server
npm run dev
```
The frontend application will now be running at `http://localhost:3000`. Open this URL in your browser to interact with the AWS Route53 Clone.
