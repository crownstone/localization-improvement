import {AUTO_WEKA_JAR_PATH, WEKA_JAR_PATH} from "../../config";
import {run} from "../runnerUtil";
import fs from "fs";


let classifiers = [
  {classifier:`weka.classifiers.bayes.BayesNet`,                       params:`-D -Q weka.classifiers.bayes.net.search.local.K2 -- -P 1 -S BAYES -E weka.classifiers.bayes.net.estimate.SimpleEstimator -- -A 0.5`},
  {classifier:`weka.classifiers.bayes.NaiveBayes`,                     params:''},
  {classifier:`weka.classifiers.bayes.NaiveBayesMultinomialText`,      params: `-P 0 -M 3.0 -norm 1.0 -lnorm 2.0 -stopwords-handler weka.core.stopwords.Null -tokenizer "weka.core.tokenizers.WordTokenizer -delimiters \" \\r\\n\\t.,;:\\\'\\\"()?!\"" -stemmer weka.core.stemmers.NullStemmer`},
  {classifier:`weka.classifiers.bayes.NaiveBayesUpdateable`,           params: ``},
  {classifier:`weka.classifiers.functions.MultilayerPerceptron`,       params: `-L 0.3 -M 0.2 -N 500 -V 0 -S 0 -E 20 -H a`},
  {classifier:`weka.classifiers.functions.SimpleLogistic`,             params: `-I 0 -M 500 -H 50 -W 0.0`},
  {classifier:`weka.classifiers.functions.SMO`,                        params: `-C 1.0 -L 0.001 -P 1.0E-12 -N 0 -V -1 -W 1 -K "weka.classifiers.functions.supportVector.PolyKernel -E 1.0 -C 250007" -calibrator "weka.classifiers.functions.Logistic -R 1.0E-8 -M -1 -num-decimal-places 4"`},
  {classifier:`weka.classifiers.lazy.IBk`,                             params: `-K 1 -W 0 -A "weka.core.neighboursearch.LinearNNSearch -A \"weka.core.EuclideanDistance -R first-last\""`},
  {classifier:`weka.classifiers.lazy.KStar`,                           params: `-B 20 -M a`},
  {classifier:`weka.classifiers.lazy.LWL`,                             params: `-U 0 -K -1 -A "weka.core.neighboursearch.LinearNNSearch -A \"weka.core.EuclideanDistance -R first-last\"" -W weka.classifiers.trees.DecisionStump`},
  {classifier:`weka.classifiers.meta.AdaBoostM1`,                      params: `-P 100 -S 1 -I 10 -W weka.classifiers.trees.DecisionStump`},
  {classifier:`weka.classifiers.meta.AttributeSelectedClassifier`,     params: `-E "weka.attributeSelection.CfsSubsetEval -P 1 -E 1" -S "weka.attributeSelection.BestFirst -D 1 -N 5" -W weka.classifiers.trees.J48 -- -C 0.25 -M 2`},
  {classifier:`weka.classifiers.meta.Bagging`,                         params: `-P 100 -S 1 -num-slots 1 -I 10 -W weka.classifiers.trees.REPTree -- -M 2 -V 0.001 -N 3 -S 1 -L -1 -I 0.0`},
  {classifier:`weka.classifiers.meta.ClassificationViaRegression`,     params: `-W weka.classifiers.trees.M5P -- -M 4.0 -num-decimal-places 4`},
  {classifier:`weka.classifiers.meta.FilteredClassifier`,              params: `-F "weka.filters.supervised.attribute.Discretize -R first-last -precision 6" -S 1 -W weka.classifiers.trees.J48 -- -C 0.25 -M 2`},
  {classifier:`weka.classifiers.meta.IterativeClassifierOptimizer`,    params: `-W weka.classifiers.meta.LogitBoost -L 50 -P 1 -E 1 -I 1 -F 10 -R 1 -percentage 0.0 -metric RMSE -S 1 -- -P 100 -L -1.7976931348623157E308 -H 1.0 -Z 3.0 -O 1 -E 1 -S 1 -I 10 -W weka.classifiers.trees.DecisionStump`},
  {classifier:`weka.classifiers.meta.LogitBoost`,                      params: `-P 100 -L -1.7976931348623157E308 -H 1.0 -Z 3.0 -O 1 -E 1 -S 1 -I 10 -W weka.classifiers.trees.DecisionStump`},
  {classifier:`weka.classifiers.meta.MultiClassClassifier`,            params: `-M 0 -R 2.0 -S 1 -W weka.classifiers.functions.Logistic -- -R 1.0E-8 -M -1 -num-decimal-places 4`},
  {classifier:`weka.classifiers.meta.MultiClassClassifierUpdateable`,  params: `-M 0 -R 2.0 -S 1 -W weka.classifiers.functions.SGD -- -F 0 -L 0.01 -R 1.0E-4 -E 500 -C 0.001 -S 1`},
  {classifier:`weka.classifiers.meta.MultiScheme`,                     params: `-X 0 -S 1 -B "weka.classifiers.bayes.BayesNet -D -Q weka.classifiers.bayes.net.search.local.K2 -- -P 1 -S BAYES -E weka.classifiers.bayes.net.estimate.SimpleEstimator -- -A 0.5" -B "weka.classifiers.functions.SMO -C 1.0 -L 0.001 -P 1.0E-12 -N 0 -V -1 -W 1 -K \"weka.classifiers.functions.supportVector.PolyKernel -E 1.0 -C 250007\" -calibrator \"weka.classifiers.functions.Logistic -R 1.0E-8 -M -1 -num-decimal-places 4\""`},
  {classifier:`weka.classifiers.meta.RandomCommittee`,                 params: `-S 1 -num-slots 1 -I 10 -W weka.classifiers.trees.RandomTree -- -K 0 -M 1.0 -V 0.001 -S 1`},
  {classifier:`weka.classifiers.meta.RandomizableFilteredClassifier`,  params: `-F "weka.filters.unsupervised.attribute.RandomProjection -N 10 -R 42 -D Sparse1" -S 1 -W weka.classifiers.lazy.IBk -- -K 1 -W 0 -A "weka.core.neighboursearch.LinearNNSearch -A \"weka.core.EuclideanDistance -R first-last\""`},
  {classifier:`weka.classifiers.meta.RandomSubSpace`,                  params: `-P 0.5 -S 1 -num-slots 1 -I 10 -W weka.classifiers.trees.REPTree -- -M 2 -V 0.001 -N 3 -S 1 -L -1 -I 0.0`},
  // {classifier:`weka.classifiers.meta.Stacking`,                        params: `-X 10 -M "weka.classifiers.rules.ZeroR " -S 1 -num-slots 1 -B "weka.classifiers.rules.ZeroR "`},
  // {classifier:`weka.classifiers.meta.Vote`,                            params: `-S 1 -B "weka.classifiers.rules.ZeroR " -R AVG`},
  // {classifier:`weka.classifiers.meta.WeightedInstancesHandlerWrapper`, params: `-S 1 -W weka.classifiers.rules.ZeroR`},
  // {classifier:`weka.classifiers.misc.InputMappedClassifier`,           params: `-I -trim -W weka.classifiers.rules.ZeroR`},
  {classifier:`weka.classifiers.rules.DecisionTable`,                  params: `-X 1 -S "weka.attributeSelection.BestFirst -D 1 -N 5"`},
  {classifier:`weka.classifiers.rules.JRip`,                           params: `-F 3 -N 2.0 -O 2 -S 1`},
  {classifier:`weka.classifiers.rules.OneR`,                           params: `-B 6`},
  {classifier:`weka.classifiers.rules.PART`,                           params: `-C 0.25 -M 2`},
  {classifier:`weka.classifiers.trees.DecisionStump`,                  params: ``},
  {classifier:`weka.classifiers.trees.HoeffdingTree`,                  params: `-L 2 -S 1 -E 1.0E-7 -H 0.05 -M 0.01 -G 200.0 -N 0.0`},
  {classifier:`weka.classifiers.trees.J48`,                            params: `-C 0.25 -M 2`},
  {classifier:`weka.classifiers.trees.LMT`,                            params: `-I -1 -M 15 -W 0.0`},
  {classifier:`weka.classifiers.trees.RandomForest`,                   params: `-P 100 -I 100 -num-slots 1 -K 0 -M 1.0 -V 0.001 -S 1`},
  {classifier:`weka.classifiers.trees.RandomTree`,                     params: `-K 0 -M 1.0 -V 0.001 -S 1`},
  {classifier:`weka.classifiers.trees.REPTree`,                        params: `-M 2 -V 0.001 -N 3 -S 1 -L -1 -I 0.0`},
]

let outputFilePath   = '/Users/alex/Dropbox/Crownstone/Projects/localization-research/weka/output/output.log'
let testFilePath     = '/Users/alex/Dropbox/Crownstone/Projects/localization-research/weka/test-sets/58de6bda62a2241400f10c67_homeV1.arff'
let trainingFilePath = '/Users/alex/Dropbox/Crownstone/Projects/localization-research/weka/training-sets/58de6bda62a2241400f10c67_fingerprint.v1.json.arff'


const wekaExecutionPrefix     = `java -cp ${WEKA_JAR_PATH}`;
const autoWekaExecutionPrefix = `java -cp ${AUTO_WEKA_JAR_PATH}:${WEKA_JAR_PATH} weka.classifiers.meta.AutoWEKAClassifier`;


export async function printWekaOptions() : Promise<void> {
  return run(`${wekaExecutionPrefix} ${classifiers[0].classifier}`)
}


export async function runWekaPercentages(splitPercentage = 5, seed = 1) : Promise<number> {
  await run(`${wekaExecutionPrefix} ${classifiers[0].classifier} -v -o -t ${testFilePath} -split-percentage ${splitPercentage} -s ${seed} ${classifiers[0].params} > ${outputFilePath}`, true);
  return getSuccessPercentage()
}

export async function runWekaCrossValidation(folds: number, seed: number) : Promise<number> {
  await run(`${wekaExecutionPrefix} ${classifiers[0].classifier} -v -t ${testFilePath} -x ${folds} -s ${seed} ${classifiers[0].params} > ${outputFilePath}`)
  return getSuccessPercentage()
}

export async function runWekaTrainingTest() : Promise<number> {
  await run(`${wekaExecutionPrefix} ${classifiers[0].classifier} -v -t ${trainingFilePath} -T ${testFilePath} ${classifiers[0].params} > ${outputFilePath}`)
  return getSuccessPercentage()
}

export async function runAutoWeka(timelimitMinutes = 1, seed: number = 123) : Promise<void> {
  return run(`${autoWekaExecutionPrefix} -t ${trainingFilePath} -T ${testFilePath} -timeLimit ${timelimitMinutes} -seed ${seed}`)
}

// training set & test set
// exec(`java -cp ${WEKA_JAR_PATH} weka.classifiers.meta.LogitBoost -P 100 -L -1.7976931348623157E308 -H 1.0 -Z 3.0 -O 1 -E 1 -S 1 -I 10 -W weka.classifiers.trees.DecisionStump -t ${trainingFilePath} -T ${testFilePath} > ${ouptutFilePath}`, callback);

function getSuccessPercentage() : number {
  let output = fs.readFileSync(outputFilePath,'utf-8');

  let match = /Correctly Classified Instances\s+\d+\s+([0-9.]+) %/.exec(output)
  return Number(match[1]);
}

/**
 * the rows ( first index ) are the expected values, the columns are the actual measured values.
 */
export function getConfusionMatrix() : {legend: string[], data: number[][] } {
  let output = fs.readFileSync(outputFilePath,'utf-8');
  let split = output.split("=== Confusion Matrix ===\n\n")[1];
  let lines = split.split("\n");
  lines.shift();
  lines.pop();
  lines.pop();
  lines = lines.map(a => a.trimStart())
  lines = lines.map(a => a.replace(/\s+/g,' '))

  let legend = [];
  let data = [];
  for (let line of lines) {
    let arr = line.split(/ \| \w = /)
    legend.push(arr[1]);
    let values = arr[0].split(" ").map(a => Number(a));
    data.push(values);
  }
  return {legend, data}
}
