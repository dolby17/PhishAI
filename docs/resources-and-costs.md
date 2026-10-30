# Resources and costs

This build used CPU training, two Random Forest workers, bounded tree depth/size, and two numerical-library threads. No CUDA setup, GPU training, paid API, reputation provider, external LLM inference, or cloud hosting was added to the product. No monetary expenditure was observed through build tools; development-assistant subscription, electricity, and user hardware costs are unknown and are not claimed as zero.

The host reports about 15 GiB RAM. Node 26.12.1 and Python 3.11.9 were used. CPU model/GPU specs were reported in the original plan but not benchmarked here. Machine-readable model inference timings record actual platform and scope. End-to-end HTTP timings, if executed, belong in the verification evidence and include API/session/inference overhead. Timings on a small local synthetic input set do not establish production throughput.

One-instance in-memory rate limits and local MongoDB are suitable for this demonstration. Horizontal scaling, distributed limits, backup/restore, ongoing data/model monitoring, hosting costs, and resource sizing remain untested. No energy/emissions figures were measured.
