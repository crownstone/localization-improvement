# Datasets

The folder structure here as defined as follows:

- dir: datasets (where this README lives)
    - dir: users
        - dir: [userName, ie: Alex]
            - dir: [scenario, ie: homeV1]
                - dir: fingerprints
                    - json: Fingerprints.(version).json
                - json: Localization_Dataset_(room-name)\_(room-uid)_(time string).json
    

This seems a little verbose. The idea is to help with automation.

### Users

This seggragation is done because a user has a number of spheres, and assuming this is all internal, we can use the user to feedback information.

### Scenarios

If you move your Crownstones around, the datasets cannot be compared directly. Each dataset belongs to a certain grouping and positioning of Crownstones or other
major changes in the environment. If we mix the fingerprints across scenarios's this would lead to a lot of explainable and preventable misclassifications.

### TestSets

A TestSet is a combination of 1 fingerprint and X datasets. A scenario has multiple TestSet.

### Fingerprints

Since each scenario can be trained multiple times, we can keep track of multiple fingerprints. 


## Disclaimer

Since a lot of the experiments have not been written yet, this is an initial guess on what an efficient structure would be.