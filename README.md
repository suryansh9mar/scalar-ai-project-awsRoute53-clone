<div align="center">

# ☁️ AWS Route53 Clone

**An enterprise-grade, full-stack emulation of the Amazon Web Services Route53 Console.**

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Cloudscape](https://img.shields.io/badge/AWS_Cloudscape-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](#)

<img width="100%" alt="AWS Route53 Clone Dashboard" src="https://github.com/user-attachments/assets/0fc13bad-cca1-4bda-9d01-ac0da2c9cea0" style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />

[Explore the Live Demo (Vercel) 🚀](https://scalar-ai-project-aws-route53-clone.vercel.app/) · [View API Docs (Render) 📚](https://scalar-ai-project-awsroute53-clone.onrender.com/docs)

</div>

---

## 🏗️ 1. Project Overview & Architecture

The **AWS Route53 Clone** is a highly scalable, full-stack web application engineered to replicate the core management features and exact user interface of Amazon Web Services (AWS) Route 53. It provides a highly functional, responsive dashboard for managing Domain Name System (DNS) configurations, hosted zones, and routing policies.

### ⚙️ Architecture Breakdown
The project operates on a modern **Client-Server model** and follows a clean monorepo structure:

*   🟧 **`frontend/` (Next.js & TypeScript):** Built with Next.js and styled using the **AWS Cloudscape Design System**, the client provides a pixel-perfect emulation of the AWS Console experience. It handles complex state management for data tables and communicates asynchronously via REST APIs.
*   🟦 **`backend/` (FastAPI & Python):** A high-performance, asynchronous Python backend. It handles business logic, input validation via Pydantic, and relational data persistence using an **SQLite** database via the **SQLAlchemy** ORM.

> *Communication between the frontend and backend flows seamlessly over standard REST APIs, ensuring loose coupling, fast response times, and ease of future scalability.*

---

## ✨ 2. Core & Advanced Features

### 🎯 Core Capabilities
- [x] **Hosted Zones Management**: Full CRUD (Create, Read, Update, Delete) capabilities with real-time searching, filtering, and pagination.
- [x] **DNS Records Management**: Comprehensive CRUD operations for records inside hosted zones. Supports multiple types: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, and `CAA`.
- [x] **Pixel-Perfect AWS UX**: Built using Cloudscape to mirror the actual AWS console, featuring dense data tables, expandable detail sections, and responsive side navigation.

### 🚀 Advanced Engineering
- [x] **BIND Zone File Import**: Quickly ingest existing DNS configurations directly from standard BIND zone files.
- [x] **Data Exporting**: Export hosted zones and records to JSON or BIND formats for backups or migrations.
- [x] **Batch Operations**: Execute fast, simultaneous actions across multiple DNS records using multi-select data tables.
- [x] **Global Keybindings**: Integrated global keyboard shortcuts (`shift+K` to search, `shift+N` to create,`shift+E` to edit,`Dlt/BackSpace` to delete) for power users.
- [x] **Dark and Light Theme**: The user can select both dark and light theme based on their prefrence which enhances the user experience. 

### 🚧 Placeholders & Upcoming
- [ ] **Dashboard**: Centralized metrics and system status (Coming Soon).
- [ ] **Traffic Policies**: Visual traffic policy builder (Coming Soon).

---

## 🗄️ 3. Database Schema Design

The backend utilizes SQLite through SQLAlchemy with a clean, normalized relational schema. 

### `HostedZone` Entity
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| 🔑 `id` | `UUID / String` | Primary Key, Unique |
| 📝 `name` | `String` | Domain Name (e.g., *example.com*) |
| 🏷️ `caller_reference` | `String` | Unique identifier for creation request |
| 🔒 `is_private` | `Boolean` | Public or Private hosted zone flag |
| 📊 `record_count` | `Integer` | Cached count of associated DNS records |
| ⏱️ `created_at` | `DateTime` | Timestamp of creation |

### `Record` Entity
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| 🔑 `id` | `UUID / String` | Primary Key, Unique |
| 🔗 **`zone_id`** | `UUID / String` | **Foreign Key (`HostedZone.id`)**, Cascade on Delete |
| 📝 `name` | `String` | Subdomain/Record Name |
| ⚙️ `type` | `String` | Record Type (A, CNAME, TXT, etc.) |
| ⏱️ `ttl` | `Integer` | Time to Live in seconds |
| 🎯 `value` | `String/Text` | Routing destination(s) |

---

## 📡 4. REST API Endpoints

The FastAPI backend exposes the following structured endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| <img src="https://img.shields.io/badge/POST-49CC90?style=flat-square" width="45"/> | `/api/auth/login` | Authenticate user and create mock session. |
| <img src="https://img.shields.io/badge/POST-49CC90?style=flat-square" width="45"/> | `/api/auth/logout` | Terminate active user session. |
| <img src="https://img.shields.io/badge/GET-097BED?style=flat-square" width="45"/> | `/api/zones` | Retrieve a paginated list of all hosted zones. |
| <img src="https://img.shields.io/badge/POST-49CC90?style=flat-square" width="45"/> | `/api/zones` | Create a new hosted zone. |
| <img src="https://img.shields.io/badge/GET-097BED?style=flat-square" width="45"/> | `/api/zones/{id}` | Retrieve details of a specific hosted zone. |
| <img src="https://img.shields.io/badge/PUT-FCA121?style=flat-square" width="45"/> | `/api/zones/{id}` | Update an existing hosted zone's details. |
| <img src="https://img.shields.io/badge/DELETE-F93E3E?style=flat-square" width="55"/> | `/api/zones/{id}` | Delete a hosted zone and its associated records. |
| <img src="https://img.shields.io/badge/GET-097BED?style=flat-square" width="45"/> | `/api/zones/{id}/records` | Get all DNS records belonging to a hosted zone. |
| <img src="https://img.shields.io/badge/POST-49CC90?style=flat-square" width="45"/> | `/api/zones/{id}/records` | Create a new DNS record in a specific zone. |
| <img src="https://img.shields.io/badge/PUT-FCA121?style=flat-square" width="45"/> | `/api/records/{id}` | Update an existing DNS record's values. |
| <img src="https://img.shields.io/badge/DELETE-F93E3E?style=flat-square" width="55"/> | `/api/records/{id}` | Delete a specific DNS record. |
| <img src="https://img.shields.io/badge/DELETE-F93E3E?style=flat-square" width="55"/> | `/api/records/bulk` | Delete multiple DNS records simultaneously. |
| <img src="https://img.shields.io/badge/POST-49CC90?style=flat-square" width="45"/> | `/api/zones/{id}/import` | Import zone configuration from a BIND file payload. |
| <img src="https://img.shields.io/badge/GET-097BED?style=flat-square" width="45"/> | `/api/zones/{id}/export` | Export a hosted zone to JSON/BIND format. |

---

## 💻 5. Local Setup & Installation

### Prerequisites
* Python 3.9+
* Node.js 18+ & npm

### Step 1: Clone the Repository
```bash
git clone https://github.com/suryansh9mar/scalar-ai-project-awsRoute53-clone.git
cd scalar-ai-project-awsRoute53-clone
```
### Step 2: Boot the Backend (FastAPI)
```bash
Open a terminal and configure the Python environment:

cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux: source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
API running at http://localhost:8000/docs
```
### Step 3: Boot the Frontend (Next.js)
```bash
Open a new terminal and configure the React environment:

cd frontend
npm install

# Create environment variable
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

npm run dev
UI running at http://localhost:3000
```
The frontend application will now be running at `http://localhost:3000`. Open this URL in your browser to interact with the AWS Route53 Clone.
***


