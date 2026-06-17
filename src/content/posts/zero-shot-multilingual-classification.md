---
title: "Zero-Shot Multilingual Classification Models"
description: "Applied to hate speech detection — comparing purely multilingual models with translation-based approaches, joint models, and the language gap vs domain gap."
date: 2021-04-06
tags: ["NLP", "machine learning", "multilingual", "transformers", "research"]
---

*Originally published on the [ELCA IT Blog](https://medium.com/elca-it/zero-shot-multilingual-classification-models-13c3c0f44ad7). Based on the MSc thesis [Cross-Lingual Toxicity Detection](/pdf/cltd.pdf).*

---

With the increasing use of social media, multilingual text classification models have become very popular recently. On the one hand, these models are advantageous because of the strongly multilingual nature of online content — not only on large social media platforms that reach a worldwide crowd, but also at a smaller scale, in multilingual countries like Switzerland. On the other hand, multilingual classification models are beneficial because they enable transfer learning approaches in situations where labelled training data is not available in the targeted language. This is very common, as for many NLP tasks, training data only exists in a few languages like English or French.

In this technical note, we present several multilingual classification approaches. While these models can be used in any cross-lingual classification problem, we take the example of hate speech detection to show how they can be used to perform zero-shot classification.

## Proposed approaches

When tackling a multilingual problem, the approach usually taken nowadays is to use a pre-trained multilingual model. Models like LASER embeddings [2] or XLM-RoBERTa [3] have been very successful in many tasks and provide an easy and flexible way to create custom multilingual models. We will refer to these types of models as **purely multilingual models**; they can take input data from many different languages and are able to create good sentence embeddings, even sometimes on languages that were not seen during training.

A second approach, less common, consists of using classical monolingual models with multilingual data that was translated to a single language beforehand. Doing so allows us to use models such as BERT [4] or RoBERTa [5], that perform better than purely multilingual models when applied to a single language. We call these **translation-based models**.

Those two approaches are illustrated in the following image; we represent here two multilingual models that can detect hate speech and offensive content, that are trained on English and German data, and evaluated on French data. The purely multilingual model (on the left) takes all data as-is, while the translation-based model (on the right) translates the German and French data to English, before using an English model.

![Purely Multilingual model (left) and Translation-based model (right)](/articles/zero-shot-multilingual/model-comparison.png)

*Purely Multilingual model (left) and Translation-based model (right)*

We will compare the two approaches on a hate speech detection task and introduce joint models that combine elements from both approaches. We will also look at the performance hit introduced by the language gap.

## Setup

We consider a zero-shot experiment to classify content as **hateful**, **offensive** or **neither**; training the model in one language and evaluating its performance on another one. We use two annotated datasets for our experiments, one in French and one in English (we use the DACHS [6] datasets).

## Models

### Translation models

We first compare purely multilingual models — such as LASER embeddings followed by a multi-layer perceptron (referred to as LASER+MLP from now on) or a fine-tuned XLM-RoBERTa classifier — with some translation-based models. We use two simple translation-based models that follow the same structure: data translation followed by a transformer model (many BERT-based models are available, we present here the models that led to the best results). In one model, all data is translated into English and the RoBERTa model is then used, and in the other model we translate all data into French and use the FlauBERT [7] model, a French model based on BERT. To translate the data, we use the MarianNMT [8] model trained on the Opus data [9].

We have an unbalanced multiclass problem: our datasets consist of approximately 6% of hateful content, 24% of offensive content, and 70% of other content. Hence, we use the macro-F1 score, which is the unweighted average of the F1-score of each class.

![Macro-F1 scores for purely multilingual and translation-based models](/articles/zero-shot-multilingual/translation-scores.png)

*Macro-F1 scores for purely multilingual and translation-based models*

We see that the best model is in both cases a translation-based model, despite the noise added to the data due to the translation, and the potential loss of meaning that can be encountered with approximate translations. In particular, the best approach is to translate the training data to the target language, and then use a monolingual model in that language. This approach has the disadvantage of requiring a translation model, which might not exist in all languages, and it adds some pre-processing time, but it can bring some non-negligible improvements. However, at least with the current setup where there is only one target language, no translations will be needed to evaluate new data, so only the initial training time is increased. This approach would not be as efficient if we wanted to target multiple languages, and in that case a purely multilingual model would be more adapted.

### Joint models

Ensemble learning is a common technique that can help the performance of classifiers, where multiple independent models are used, and a combination of the predictions (e.g. a vote or average) is performed at the end. In line with this idea, we can perform **joint learning**, that more closely combines multiple classification approaches. The outputs of all joined models are concatenated and passed through multiple neural network layers. The resulting network is then trained jointly, by applying backpropagation to all sub-models.

An example of such a joint architecture (we will refer to it as a **joint model**) is illustrated below, where we use two LASER embeddings networks whose outputs are concatenated and go through a few linear layers. To help with the performance, we add some variation to the joint model by assigning a language to each of the joined networks. One network will work with English data (some of it translated from French), and one will work with French data (some of it translated from English). The intuition behind this is that the outputs of both sub-models are complementary and should create a better representation of the input data, leading to a better classification.

In the example illustrated below, we use English training data, that is given as-is to one of the models, and in parallel translated to French to be given to the other model. Each model consists of LASER embeddings sent through a few linear layers, and is fully independent from the other model. The French data used for evaluation is then directly passed to the French model, and additionally input to the English model after going through translation.

![Joint model with LASER embeddings and data translation](/articles/zero-shot-multilingual/joint-laser.png)

*Joint model with LASER embeddings and data translation*

We compare the performance of such a network with a simple, purely multilingual model where LASER embeddings are used multilingually with both French and English data.

![Simple model vs joint model](/articles/zero-shot-multilingual/simple-vs-joint.png)

*Simple model vs joint model*

The Joint model is clearly useful, although the difference in performance might not be enough to justify the increased complexity.

### Joint translation models

While our first joint model approach solely relies on purely multilingual classifiers, we now propose to join purely multilingual models with translation-based models. We show an example of this architecture in the illustration below; one purely multilingual LASER model and one translation-based FlauBERT model with translation of English data to French.

![Joint model with LASER embeddings, Transformer and data translation](/articles/zero-shot-multilingual/joint-laser-transformer.png)

*Joint model with LASER embeddings, Transformer and data translation*

This approach can be implemented in multiple ways. We use two versions, that were in our experience the best alternatives:

- **English training data, French test data**: We combine a LASER model with a FlauBERT model that uses translations to French
- **French training data, English test data**: We combine a LASER model with a RoBERTa model that uses translations to English

For a fair comparison of the performance when using a translation-based model as part of this architecture compared to using only multilingual models, we compare this to another model with similar complexity — also a joint model — where we simply combine the LASER model with a multilingual XLM-RoBERTa. The models with translations will have slightly larger training time as we need to translate the data once, but a similar evaluation time as no further translations are required for inference.

![Joint models — purely multilingual vs translation-based](/articles/zero-shot-multilingual/joint-translation-scores.png)

*Joint models — purely multilingual vs translation-based*

We see that the joint models that use both the multilingual and the translation approach clearly outperform the models that only use purely multilingual sub-models. This is a viable approach that does not add too much complexity to the models. The translation of the data can be seen as data augmentation; the translated sentences act as synonyms and variations of the original data, which will cover more cases, and help the performance of the model when new data is presented.

Our experiments show that using translations is a viable alternative to multilingual models, and despite being a little bit more complex to setup can lead to better results. Additionally, joining multiple models can further improve the performance. We have also shown that adding simple sentence embeddings to the output of a complex deep neural network can increase the performance while adding very little complexity.

## Domain Gap versus Language Gap

One major problem with zero-shot learning is the domain gap between the training dataset and the target data. But what about the language gap that occurs when using multilingual models? We look at both with some examples coming from our original use case: hate speech detection.

We were able to find multiple datasets that supposedly contained the same type of content: hateful, offensive and other tweets. However, we realized that they often differed in actual content and class distribution, which causes some domain gap. Depending on the country of origin, the topics mentioned in the tweets will be different (e.g. political or social issues). Moreover, the fact that we combine multiple languages together also adds some language gap, as some words (e.g. insults) might not have the same meaning or connotation in different languages.

To illustrate this, we explore four scenarios:

1. **Baseline; no domain gap and no language gap**: Content of the training data is very close to the content of the target data, and in the same language.
2. **No domain gap but a language gap**: Content of the training data is very close to the content of the target data, but in a different language.
3. **Domain gap but no language gap**: Content of the training data is not as close to the content of the target data, but they are in the same language.
4. **Domain gap and language gap**: Content of the training data is not as close to the content of the target data, and they are in a different language.

To illustrate this problem, we selected two datasets, one in English and one in French, that originated from the same authors (we still use the DACHS dataset), and that contain tweets annotated as hate speech, offensive, or neither. To simulate having very similar content but a different language (case 2), we select one dataset, split it into train and test sets, and translate one of the two to another language. To simulate having less similar content, but the same language (case 3), we use data from one dataset for training, data from the other dataset for evaluation, but translate one of them to the other language.

![Comparison of domain gap and language gap](/articles/zero-shot-multilingual/domain-language-gap.webp)

*Comparison of domain gap and language gap*

As expected, the best scores happen when we use very similar data with the same language for training and evaluation. However, we see that we get significantly higher scores when we only have the language gap than when we only have some domain gap. It is important to remember that the datasets used here come from the same authors, and that the same annotation guidelines were used in both languages, but despite this, combining both datasets bring a significant domain gap which has a large impact on the performance.

The conclusion that comes from this is the following: If for a given problem there are multiple small datasets available, and that one wants to combine them, it is important not to exclude data in other languages; **the performance hit brought by the language gap can be significantly lower than the one brought by the domain gap**. Translation-based models and multilingual models are able to handle the language gap relatively well.

## Conclusion

We saw that pre-trained multilingual models are not the only way to solve a multilingual problem. If it is possible to translate the data for the given languages, an approach with a monolingual model can be beneficial. It is also important to look at joint models; adding simple sentence embeddings to a complex transformer model is enough to see some improvements. It can provide a significant performance boost without increasing the training time too much. The use of translation-based models with the joint approach can also work very well.

It is also important not to underestimate the power of current multilingual and translation models, and a dataset that is not in the desired language should never be ignored if there are not many alternatives available.

## Sources

[1] [Cross-lingual Toxicity Detection](/pdf/cltd.pdf), Loïs Bilat et. al., 2020

[2] Massively Multilingual Sentence Embeddings for Zero-Shot Cross-Lingual Transfer and Beyond, Mikel Artetxe et. al., 2019, [arXiv:1812.10464](https://arxiv.org/abs/1812.10464)

[3] Unsupervised Cross-lingual Representation Learning at Scale, Alexis Conneau et. al., 2019, [arXiv:1911.02116](https://arxiv.org/abs/1911.02116)

[4] BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding, Jacob Devlin et. al., 2019, [arXiv:1810.04805](https://arxiv.org/abs/1810.04805)

[5] RoBERTa: A Robustly Optimized BERT Pretraining Approach, Yinhan Liu et. al., 2019, [arXiv:1907.11692](https://arxiv.org/abs/1907.11692)

[6] Towards countering hate speech against journalists on social media, Charitidis et. al., 2020, [arXiv:1912.04106](https://arxiv.org/abs/1912.04106)

[7] FlauBERT: Unsupervised Language Model Pre-training for French, Hang Le et. al., 2020, [arXiv:1912.05372](https://arxiv.org/abs/1912.05372)

[8] Marian: Fast Neural Machine Translation in C++, Junczys-Dowmunt et. al., 2018

[9] Building open translation services for the World, Jörg Tiedemann et. al., 2020
