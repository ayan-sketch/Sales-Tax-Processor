# Graph Report - .  (2026-07-14)

## Corpus Check
- 263 files · ~405,230 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 316 nodes · 123 edges · 239 communities (7 shown, 232 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Backend Infrastructure & IRIS
- Withholding Tax Concepts
- Frontend Core Features
- App Routing & Navigation
- OD Skills & Agent Browser
- Section 165 Statements
- Landing Page UI
- Error Pages
- Dashboard Mockups
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 222
- Community 223
- Community 224
- Community 225
- Community 226
- Community 227
- Community 228
- Community 229
- Community 230
- Community 231
- Community 232
- Community 233
- Community 234
- Community 235
- Community 236
- Community 237
- Community 238

## God Nodes (most connected - your core abstractions)
1. `Section 153(1)(a) - Payment for Goods` - 11 edges
2. `Khawar Khan (Withholding Agent / CNIC 1310112184639)` - 10 edges
3. `WithholdingPage (Main WHT Route Component)` - 10 edges
4. `Section 165 - Withholding Tax Statements` - 7 edges
5. `Section165Page (WHT Statement 165 Entry/Upload UI)` - 7 edges
6. `Web Prototype Skill` - 6 edges
7. `Pepsi-Cola International (Private) Limited` - 6 edges
8. `ChallanImportPanel (PDF Import for 236H/153)` - 6 edges
9. `Agent Browser Automation Skill` - 5 edges
10. `FastAPI Backend` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Tax Suite Application Icon` --semantically_similar_to--> `Tax Suite HD Application Icon`  [INFERRED] [semantically similar]
  frontend/public/icon.png → tax sute icon hD final.png
- `Landing Solutions Section (Withholding Mention)` --references--> `Section 153(1)(a) - Payment for Goods`  [EXTRACTED]
  frontend/src/features/landing/components/solutions.tsx → PDF for Extraction/198581566.pdf
- `StatementImportPanel (Excel/PDF Import for 165)` --references--> `Section 165 - Withholding Tax Statements`  [INFERRED]
  frontend/src/features/withholding/components/StatementImportPanel.tsx → Withholding statement 165 validation rule/whts-validation-checks.pdf
- `Dashboard Stat Cards (Withholding Challans Metric)` --conceptually_related_to--> `Section 165 - Withholding Tax Statements`  [INFERRED]
  frontend/src/pages/Dashboard/components/stat-cards.tsx → Withholding statement 165 validation rule/whts-validation-checks.pdf
- `Tax Compliance Dashboard Screenshot` --semantically_similar_to--> `Tax Compliance Overview Graphic`  [INFERRED] [semantically similar]
  Tax Compliance Dashboard Picture.png → TaxCompliance.png

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Backend Technology Stack** — backend_requirements_fastapibackend, docker_compose_yml_postgresinfra, requirements_txt_vercelfastapi [INFERRED 0.95]
- **Tax Data Processing Pipeline** — iris_automation_config_irisautomation, pdf_for_extraction_challans, pdf_for_extraction_cprreceipts, khawar_khan_withholdingagent, section_153_1_a_withholdingtax [INFERRED 0.85]
- **Web Prototype Asset Chain** — od_skills_web_prototype_71992a9236_skill_webprototypeskill, od_skills_web_prototype_71992a9236_assets_template_seedtemplate, od_skills_web_prototype_71992a9236_references_layouts_sectionskeletons, od_skills_web_prototype_71992a9236_references_checklist_qualitychecklist, od_skills_web_prototype_71992a9236_example_tomato [EXTRACTED 1.00]
- **Khawar Khan Section 153(1)(a) Payment Series for Pepsi-Cola (Sep-Dec 2025)** — entity_khawar_khan, entity_pepsi_cola_international, concept_section_153_1_a, pdf_for_extraction_it2025090401011099865_1, pdf_for_extraction_it2025093001011810449, pdf_for_extraction_it2025102901011764066, pdf_for_extraction_it2025112701011777262, pdf_for_extraction_it2025122401011790880 [EXTRACTED 1.00]
- **Withholding Tax Feature Architecture (Frontend)** — frontend_src_features_withholding_pages_withholdingpage_withholdingpage, statement165_components_section165page, frontend_src_features_withholding_components_challanimportpanel_challanimportpanel, frontend_src_features_withholding_components_statementimportpanel_statementimportpanel, frontend_src_features_withholding_components_withholdingtable_withholdingtable, frontend_src_features_withholding_components_withholdingform_withholdingform, frontend_src_features_withholding_hooks_usewithholding_usewithholding, frontend_src_features_withholding_validations_withholdingschema_schema, frontend_src_features_withholding_services_withholdingservice_withholdingservice, frontend_src_features_statement165_services_statement165service_statement165service, frontend_src_components_navigation_sidebar_sidebar, frontend_src_app_app_withholding_routes [EXTRACTED 1.00]
- **Application Static Asset Usage Group** — frontend_public_icon, frontend_public_logo, frontend_public_images_avatar_1, frontend_public_images_avatar_2, frontend_public_images_avatar_3, frontend_public_images_astronaut_portal, frontend_public_images_connection_error, frontend_public_images_section_165, frontend_src_pages_register_register_register_page, frontend_src_pages_login_login_login_page, landing_components_hero_hero_section, pages_notfound_notfoundpage, pages_connectionerror_connectionerrorpage, frontend_src_components_navigation_sidebar_sidebar [EXTRACTED 1.00]

## Communities (239 total, 232 thin omitted)

### Community 0 - "Backend Infrastructure & IRIS"
Cohesion: 0.21
Nodes (17): FastAPI Backend, PostgreSQL with PgBouncer Infrastructure, React Vite Frontend, IRIS FBR Portal Automation, IRIS Playwright Automation Dependencies, IRIS FBR Pakistan Tax Portal, KHAWAR KHAN Withholding Agent, Proprietary Software License (+9 more)

### Community 1 - "Withholding Tax Concepts"
Cohesion: 0.31
Nodes (14): Section 153(1)(a) - Payment for Goods, Section 236H - Purchase by Retailers, Khawar Khan (Withholding Agent / CNIC 1310112184639), Pepsi-Cola International (Private) Limited, RTO Abbottabad (Regional Tax Office), Shimla Marketing (Business Name of Khawar Khan), Income Tax Payment Challan PSID #198581566, CPR IT-20250904-0101-1099865 (Sep 2025) (+6 more)

### Community 2 - "Frontend Core Features"
Cohesion: 0.19
Nodes (14): Client Type (Withholding Registration Fields), Statement 165 API Service, ChallanImportPanel (PDF Import for 236H/153), ImportResultCard (Import Result Display), StatementImportPanel (Excel/PDF Import for 165), WithholdingForm (Create/Edit Record Form), WithholdingTable (Record Listing Component), useWithholding React Query Hook (+6 more)

### Community 3 - "App Routing & Navigation"
Cohesion: 0.18
Nodes (11): Tax Suite Application Icon, Connection Error Illustration, Tax Suite SVG Logo, App Router Withholding Route Definitions, Sidebar Navigation (Withholding Section Links), Login Page (Uses /icon.png), Register Page (Uses /icon.png), API Client Service (Connection Error Redirect) (+3 more)

### Community 4 - "OD Skills & Agent Browser"
Cohesion: 0.22
Nodes (11): agent-browser CLI, Agent Browser Automation Skill, Browser Safety Rules, Chrome DevTools Protocol, Open Design Preview Validation, Web Prototype Seed Template, Tomato Timer Example, Web Prototype Quality Checklist (+3 more)

### Community 5 - "Section 165 Statements"
Cohesion: 0.24
Nodes (10): Section 165 - Withholding Tax Statements, WHT Statement 20-Column Validation Rule Set, Section 165 Compliance Illustration, Excel Utility Library for Statement 165, WhtEntry and StatementSession Types, Dashboard Stat Cards (Withholding Challans Metric), Landing Solutions Section (Withholding Mention), Section165Icon (Animated SVG Badge Component) (+2 more)

### Community 6 - "Landing Page UI"
Cohesion: 0.40
Nodes (5): Business Owner Portrait Avatar, Company Administrator Portrait Avatar, Finance Professional Portrait Avatar, Landing Dashboard Mockup Component, Landing Hero Section (Avatar Images)

## Knowledge Gaps
- **259 isolated node(s):** `obfuscatorPlugin`, `AdminRoute`, `ProtectedRoute`, `PendingClient`, `useBackups` (+254 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **232 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WithholdingPage (Main WHT Route Component)` connect `Frontend Core Features` to `App Routing & Navigation`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `App Router Withholding Route Definitions` connect `App Routing & Navigation` to `Frontend Core Features`, `Section 165 Statements`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Section 153(1)(a) - Payment for Goods` connect `Withholding Tax Concepts` to `Frontend Core Features`, `Section 165 Statements`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Income Tax Payment Challans` (e.g. with `IRIS FBR Portal Automation` and `PDF Tax Data Extraction Pipeline`) actually correct?**
  _`Income Tax Payment Challans` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Computerized Payment Receipts` (e.g. with `PDF Tax Data Extraction Pipeline` and `Income Tax Payment Challans`) actually correct?**
  _`Computerized Payment Receipts` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `obfuscatorPlugin`, `AdminRoute`, `ProtectedRoute` to the rest of the system?**
  _259 weakly-connected nodes found - possible documentation gaps or missing edges._