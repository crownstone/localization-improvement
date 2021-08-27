"use strict";

/**
 * Based on https://github.com/karpathy/tsnejs
 */

// utility function
function assert(condition, message) {
  if (!condition) {
    throw message || "Assertion failed";
  }
}

// return 0 mean unit standard deviation random number
let return_v = false;
let v_val = 0.0;
function gaussRandom() {
  if (return_v) {
    return_v = false;
    return v_val;
  }
  let u = 2 * Math.random() - 1;
  let v = 2 * Math.random() - 1;
  let r = u * u + v * v;
  if(r == 0 || r > 1) {
    return gaussRandom();
  }
  let c = Math.sqrt(-2*Math.log(r)/r);
  v_val = v*c; // cache this for next function call for efficiency
  return_v = true;
  return u*c;
}

// return random normal number
function randn(mu, std){
  return mu+gaussRandom()*std;
}

// utilitity that creates contiguous vector of zeros of size n
function zeros(n = 0) : Float64Array {
  return new Float64Array(n); // typed arrays are faster
}

// utility that returns 2d array filled with random numbers
// or with value defaultValue, if provided
function randn2d(size : number, dimensions: number, defaultValue = null) : number[][] {
  let x = [];
  for(let i = 0; i < size; i++) {
    let xhere = [];
    for(let j = 0; j < dimensions; j++) {
      if (defaultValue !== null) {
        xhere.push(defaultValue);
      }
      else {
        xhere.push(randn(0.0, 1e-4));
      }
    }
    x.push(xhere);
  }
  return x;
}

// compute L2 distance between two vectors
let L2 = function(x1, x2) {
  let D = x1.length;
  let d = 0;
  for(let i=0;i<D;i++) {
    let x1i = x1[i];
    let x2i = x2[i];
    d += (x1i-x2i)*(x1i-x2i);
  }
  return d;
}

// compute pairwise distance in all vectors in X
let XtoD = function(X) {
  let N = X.length;
  let dist = zeros(N * N); // allocate contiguous array
  for(let i=0;i<N;i++) {
    for(let j=i+1;j<N;j++) {
      let d = L2(X[i], X[j]);
      dist[i*N+j] = d;
      dist[j*N+i] = d;
    }
  }
  return dist;
}

// compute (p_{i|j} + p_{j|i})/(2n)
let d2p = function(D, perplexity, tol) : Float64Array {
  let Nf = Math.sqrt(D.length); // this better be an integer
  let N = Math.floor(Nf);
  assert(N === Nf, "D should have square number of elements.");
  let Htarget = Math.log(perplexity); // target entropy of distribution
  let P = zeros(N * N); // temporary probability matrix

  let prow = zeros(N); // a temporary storage compartment
  for(let i=0;i<N;i++) {
    let betamin = -Infinity;
    let betamax = Infinity;
    let beta = 1; // initial value of precision
    let done = false;
    let maxtries = 50;

    // perform binary search to find a suitable precision beta
    // so that the entropy of the distribution is appropriate
    let num = 0;
    while(!done) {
      //debugger;

      // compute entropy and kernel row with beta precision
      let psum = 0.0;
      let pj;
      for(let j = 0; j < N; j++) {
        pj = Math.exp(- D[i*N+j] * beta);
        if(i === j) {
          pj = 0; // we dont care about diagonals
        }
        prow[j] = pj;
        psum += pj;
      }

      // normalize p and compute entropy
      let Hhere = 0.0;
      for(let j=0;j<N;j++) {
        if(psum == 0) {
          pj = 0;
        }
        else {
          pj = prow[j] / psum;
        }
        prow[j] = pj;
        if(pj > 1e-7) {
          Hhere -= pj * Math.log(pj);
        }
      }

      // adjust beta based on result
      if(Hhere > Htarget) {
        // entropy was too high (distribution too diffuse)
        // so we need to increase the precision for more peaky distribution
        betamin = beta; // move up the bounds
        if(betamax === Infinity) { beta = beta * 2; }
        else { beta = (beta + betamax) / 2; }

      }
      else {
        // converse case. make distrubtion less peaky
        betamax = beta;
        if (betamin === -Infinity) {
          beta = beta / 2;
        }
        else {
          beta = (beta + betamin) / 2;
        }
      }

      // stopping conditions: too many tries or got a good precision
      num++;
      if(Math.abs(Hhere - Htarget) < tol) { done = true; }
      if(num >= maxtries) { done = true; }
    }

    // console.log('data point ' + i + ' gets precision ' + beta + ' after ' + num + ' binary search steps.');
    // copy over the final prow to P at row i
    for(let j=0;j<N;j++) { P[i*N+j] = prow[j]; }

  } // end loop over examples i

  // symmetrize P and normalize it to sum to 1 over all ij
  let Pout = zeros(N * N);
  let N2 = N*2;
  for(let i = 0; i < N; i++) {
    for(let j = 0; j < N; j++) {
      Pout[i*N+j] = Math.max((P[i*N+j] + P[j*N+i])/N2, 1e-100);
    }
  }

  return Pout;
}

// helper function
function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }

export class tSNE {
  perplexity: number = 30; // effective number of nearest neighbors
  dimension:  number = 2;  // by default 2-D tSNE
  epsilon:    number = 10; // learning rate
  iteration:  number = 0;

  P : Float64Array;
  N : number;
  Y : number[][];
  ystep : number[][];
  gains : number[][];

  constructor(options = {}) {
    this.perplexity = options["perplexity"] ?? this.perplexity;
    this.dimension  = options["dimension"]  ?? this.dimension;
    this.epsilon    = options["epsilon"]    ?? this.epsilon;
  }


  /**
   * this function takes a set of high-dimensional points
   * and creates matrix P from them using gaussian kernel
   * @param X
   */
  initDataRaw(X) {
    let N = X.length;
    let D = X[0].length;
    assert(N > 0, " X is empty? You must have some data!");
    assert(D > 0, " X[0] is empty? Where is the data?");
    let dists = XtoD(X); // convert X to distances using gaussian kernel
    this.P = d2p(dists, this.perplexity, 1e-4); // attach to object
    this.N = N; // back up the size of the dataset
    this.initSolution(); // refresh this
  }

  /**
   * this function takes a given distance matrix and creates
   * matrix P from them.
   * D is assumed to be provided as a list of lists, and should be symmetric
   * @param D
   */
  initDataDistribution(D) {
    let N = D.length;
    assert(N > 0, " X is empty? You must have some data!");
    // convert D to a (fast) typed array version
    let dists = zeros(N * N); // allocate contiguous array
    for(let i = 0; i < N; i++) {
      for(let j= i + 1; j < N; j++) {
        let d = D[i][j];
        dists[i*N + j] = d;
        dists[j*N + i] = d;
      }
    }
    this.P = d2p(dists, this.perplexity, 1e-4);
    this.N = N;
    this.initSolution(); // refresh this
  }

  // (re)initializes the solution to random
  initSolution() {
    // generate random solution to t-SNE
    this.Y     = randn2d(this.N, this.dimension); // the solution
    this.gains = randn2d(this.N, this.dimension, 1.0); // step gains to accelerate progress in unchanging directions
    this.ystep = randn2d(this.N, this.dimension, 0.0); // momentum accumulator
    this.iteration = 0;
  }

  // return pointer to current solution
  getSolution() {
    return this.Y;
  }

  // perform a single step of optimization to improve the embedding
  step() {
    this.iteration += 1;
    let N = this.N;

    let cg = this.costGrad(this.Y); // evaluate gradient
    let cost = cg.cost;
    let grad = cg.grad;

    // perform gradient step
    let ymean = zeros(this.dimension);
    for(let i = 0; i < N; i++) {
      for(let d = 0; d < this.dimension; d++) {
        let gid    = grad[i][d];
        let sid    = this.ystep[i][d];
        let gainid = this.gains[i][d];

        // compute gain update
        let newgain = sign(gid) === sign(sid) ? gainid * 0.8 : gainid + 0.2;
        if(newgain < 0.01) newgain = 0.01; // clamp
        this.gains[i][d] = newgain; // store for next turn

        // compute momentum step direction
        let momval = this.iteration < 250 ? 0.5 : 0.8;
        let newsid = momval * sid - this.epsilon * newgain * grad[i][d];
        this.ystep[i][d] = newsid; // remember the step we took

        // step!
        this.Y[i][d] += newsid;

        ymean[d] += this.Y[i][d]; // accumulate mean so that we can center later
      }
    }

    // reproject Y to be zero mean
    for(let i = 0;i < N; i++) {
      for(let d = 0; d < this.dimension; d++) {
        this.Y[i][d] -= ymean[d]/N;
      }
    }

    //if(this.iteration%100===0) console.log('iteration ' + this.iteration + ', cost: ' + cost);
    return cost; // return current cost
  }

  // for debugging: gradient check
  _debugGrad() {
    let N = this.N;

    let cg = this.costGrad(this.Y); // evaluate gradient
    let cost = cg.cost;
    let grad = cg.grad;

    let e = 1e-5;
    for(let i=0;i<N;i++) {
      for(let d=0; d<this.dimension; d++) {
        let yold = this.Y[i][d];

        this.Y[i][d] = yold + e;
        let cg0 = this.costGrad(this.Y);

        this.Y[i][d] = yold - e;
        let cg1 = this.costGrad(this.Y);

        let analytic = grad[i][d];
        let numerical = (cg0.cost - cg1.cost) / ( 2 * e );
        console.log(i + ',' + d + ': gradcheck analytic: ' + analytic + ' vs. numerical: ' + numerical);

        this.Y[i][d] = yold;
      }
    }
  }

  // return cost and gradient, given an arrangement
  costGrad(Y) {
    let N          = this.N;
    let dimensions = this.dimension; // dimension of output space
    let P          = this.P;

    let pmul = this.iteration < 100 ? 4 : 1; // trick that helps with local optima

    // compute current Q distribution, unnormalized first
    let Qu = zeros(N * N);
    let qsum = 0.0;
    for(let i = 0; i < N; i++) {
      for(let j= i + 1; j < N; j++) {
        let dsum = 0.0;
        for(let d = 0; d < dimensions; d++) {
          let dhere = Y[i][d] - Y[j][d];
          dsum += dhere * dhere;
        }
        let qu = 1.0 / (1.0 + dsum); // Student t-distribution
        Qu[i*N+j] = qu;
        Qu[j*N+i] = qu;
        qsum += 2 * qu;
      }
    }
    // normalize Q distribution to sum to 1
    let NN = N*N;
    let Q = zeros(NN);
    for (let q=0; q<NN; q++) {
      Q[q] = Math.max(Qu[q] / qsum, 1e-100);
    }

    let cost = 0.0;
    let grad = [];
    for(let i = 0; i < N; i++) {
      let gsum = new Array(dimensions); // init grad for point i
      for(let d = 0; d < dimensions; d++) {
        gsum[d] = 0.0;
      }
      for(let j = 0; j < N; j++) {
        cost += - P[i*N+j] * Math.log(Q[i*N+j]); // accumulate cost (the non-constant portion at least...)
        let premult = 4 * (pmul * P[i*N+j] - Q[i*N+j]) * Qu[i*N+j];
        for(let d = 0; d < dimensions; d++) {
          gsum[d] += premult * (Y[i][d] - Y[j][d]);
        }
      }
      grad.push(gsum);
    }

    return {cost: cost, grad: grad};
  }
}
