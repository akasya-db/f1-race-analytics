# Akasya F1DB — Formula 1 Performance Analytics Platform

**Akasya F1DB** is a web‑based analytics platform that merges real Formula 1 data with user‑generated racing data from multiplayer simulations. The goal is to let racing enthusiasts compare their own performance with real‑world F1 results through interactive statistics, visualizations, and database‑driven insights.

## 🌍 Project Vision

The platform is designed as an educational yet fully functional database application demonstrating relational database design, SQL query optimization, and web integration. It brings together authentic F1 statistics and user submissions in a single unified interface.

When completed, the system will allow users to:

* Browse and filter Formula 1 races, circuits, drivers, and constructors.
* Upload their own simulation race data and compare it to official statistics.
* Analyze lap times, podiums, wins, and season performance metrics through charts and rankings.
* Observe relationships between variables such as qualifying vs. grid position or constructor vs. driver standings.
* Interact with the data through a clean Flask‑based web interface backed by a PostgreSQL database.

## 🧩 Core Technologies

* **Backend:** Python (Flask Framework) + PostgreSQL (SQL‑based, no ORM)
* **Frontend:** HTML, CSS, and  JavaScript for visualization
* **Data Source:** [F1DB](https://github.com/f1db/f1db) open dataset

## 🧠 Design Overview

The database contains entities such as `driver`, `constructor`, `race`, `country`, and `race_data`, representing both official and user‑submitted results. Relationships and foreign keys model the structure of real F1 seasons. CRUD operations, joins, subqueries, and aggregation queries are implemented to provide detailed insights.

## 👥 Team Members

* **Nurettin Alper Kuzu** 
* **Ege Demir**
* **İsmail Yeşilyurt**
* **Turan İnceöz** 
* **Sıla Keküllüoğlu** 

## 🎯 Expected Outcome

By the end of the project, Akasya F1DB will serve as a comprehensive Formula 1 analytics web app that:

* Demonstrates complete database integration and manipulation using PostgreSQL.
* Provides interactive exploration of real and simulated racing results.
* Highlights how structured data can power visual and analytical insights.

---

*Developed as part of the ****************BLG317E – Database Systems**************** course at Istanbul Technical University.*
