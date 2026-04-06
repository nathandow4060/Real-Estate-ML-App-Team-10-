#WIP
df_features = df_train.drop(columns=train_targets)
feature_names = df_features.columns.tolist()

booster = nys_math_model.get_booster()
booster.feature_names = feature_names # a list of length n_features

fig, ax = plt.subplots(figsize=(8, len(feature_names) * 0.4))  # dynamic height
# most important importance_types: gain, weight, cover
plot_importance(booster, importance_type="gain", ax=ax, height=0.3)
pyplot.show()