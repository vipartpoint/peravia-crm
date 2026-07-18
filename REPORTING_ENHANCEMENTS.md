# Reporting & BI Enhancements

## Overview
By enforcing relational catalogs over free-text fields, the CRM will unlock advanced dashboard analytics and business intelligence capabilities. 

## Enhanced Dashboard Metrics

### 1. Top Lost Reasons
A pie or bar chart summarizing lost opportunities grouped by `LostReason.nameFa`. This enables the sales director to identify systemic bottlenecks (e.g., if 40% of deals are lost due to `PRICE`, pricing strategy may need adjustment).

### 2. Top Competitors
Analytics visualizing which specific competitors are capturing lost deals. Grouped by `Competitor.name`, this data highlights primary market rivals and identifies where competitive advantages need to be developed.

### 3. Reopen Reasons
Tracking the most common `ReopenReason` (e.g., `CUSTOMER_RETURNED`) helps identify post-loss follow-up strategies that work and informs sales reps on effective callback messaging.

### 4. Competitor Win Rate
A ratio of deals won versus deals explicitly lost to a specific competitor. This provides granular insight into head-to-head performance against specific rival brands.

### 5. Lost by Stage & Reason Matrix
A cross-tabulation mapping `salesStage` at the time of loss against the `LostReason`. For example, losing in `Analysis` due to `PRICE` versus losing in `Close` due to `DELIVERY_TIME`.

## Future AI Integration
These normalized data points are prerequisite inputs for future AI models. Free-text is notoriously difficult for predictive analytics without NLP pre-processing. By establishing hard categorical features, the AI recommendation engine will be able to:
- Predict churn risk based on the presence of a specific competitor.
- Suggest optimal discount thresholds if the predicted loss reason is `PRICE`.
